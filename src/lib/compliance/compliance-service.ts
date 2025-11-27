/**
 * LGPD Compliance Service
 * Manages consent, data export, deletion requests, and transaction limits
 *
 * NOTE: This service uses 'any' typing for Supabase client because the
 * compliance tables (lgpd_consents, consent_templates, etc.) are defined
 * in migration 20251127_add_lgpd_compliance_tables.sql but the TypeScript
 * types have not been regenerated yet. After running the migration and
 * regenerating types with `bunx supabase gen types`, this can be updated
 * to use proper typed client.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { secureLogger } from '@/lib/logging/secure-logger';
import type {
	CheckLimitResponse,
	CollectionMethod,
	ComplianceEventType,
	ConsentTemplate,
	ConsentType,
	DataDeletionRequest,
	DataDeletionRequestType,
	DataExportFormat,
	DataExportRequest,
	DataExportRequestType,
	LgpdConsent,
	TransactionLimit,
	TransactionLimitType,
} from '@/types/compliance';

// Using any type until migration is applied and types regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = SupabaseClient<any>;

export class ComplianceService {
	constructor(private supabase: SupabaseClientType) {}

	// ========================================
	// CONSENT MANAGEMENT
	// ========================================

	/**
	 * Get all consents for a user
	 */
	async getUserConsents(userId: string): Promise<LgpdConsent[]> {
		const { data, error } = await this.supabase
			.from('lgpd_consents')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			secureLogger.error('Failed to get user consents', {
				error: error.message,
				userId,
			});
			throw new Error(`Erro ao buscar consentimentos: ${error.message}`);
		}

		return (data ?? []) as unknown as LgpdConsent[];
	}

	/**
	 * Get active consent templates
	 */
	async getConsentTemplates(): Promise<ConsentTemplate[]> {
		const { data, error } = await this.supabase
			.from('consent_templates')
			.select('*')
			.eq('is_active', true)
			.order('consent_type');

		if (error) {
			secureLogger.error('Failed to get consent templates', {
				error: error.message,
			});
			throw new Error(
				`Erro ao buscar modelos de consentimento: ${error.message}`,
			);
		}

		return (data ?? []) as unknown as ConsentTemplate[];
	}

	/**
	 * Grant a consent
	 */
	async grantConsent(
		userId: string,
		consentType: ConsentType,
		collectionMethod: CollectionMethod,
		ipAddress?: string,
		userAgent?: string,
	): Promise<LgpdConsent> {
		// Get the template for this consent type
		const { data: template } = await this.supabase
			.from('consent_templates')
			.select('*')
			.eq('consent_type', consentType)
			.eq('is_active', true)
			.order('version', { ascending: false })
			.limit(1)
			.single();

		if (!template) {
			throw new Error(`Modelo de consentimento não encontrado: ${consentType}`);
		}

		// Generate hash of consent text
		const textHash = await this.generateHash(template.full_text_pt);

		const { data, error } = await this.supabase
			.from('lgpd_consents')
			.upsert(
				{
					user_id: userId,
					consent_type: consentType,
					purpose: template.description_pt,
					legal_basis: 'consent',
					granted: true,
					granted_at: new Date().toISOString(),
					revoked_at: null,
					consent_version: template.version,
					consent_text_hash: textHash,
					collection_method: collectionMethod,
					ip_address: ipAddress,
					user_agent: userAgent,
				},
				{
					onConflict: 'user_id,consent_type,consent_version',
				},
			)
			.select()
			.single();

		if (error) {
			secureLogger.error('Failed to grant consent', {
				error: error.message,
				userId,
				consentType,
			});
			throw new Error(`Erro ao registrar consentimento: ${error.message}`);
		}

		secureLogger.info('Consent granted', { userId, consentType });
		return data as unknown as LgpdConsent;
	}

	/**
	 * Revoke a consent
	 */
	async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
		const { error } = await this.supabase
			.from('lgpd_consents')
			.update({
				revoked_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('user_id', userId)
			.eq('consent_type', consentType)
			.eq('granted', true)
			.is('revoked_at', null);

		if (error) {
			secureLogger.error('Failed to revoke consent', {
				error: error.message,
				userId,
				consentType,
			});
			throw new Error(`Erro ao revogar consentimento: ${error.message}`);
		}

		secureLogger.info('Consent revoked', { userId, consentType });
	}

	/**
	 * Check if user has required consents
	 */
	async checkRequiredConsents(
		userId: string,
		requiredConsents: ConsentType[],
	): Promise<boolean> {
		const { data, error } = await this.supabase.rpc('check_required_consents', {
			p_user_id: userId,
			p_required_consents: requiredConsents,
		});

		if (error) {
			secureLogger.error('Failed to check required consents', {
				error: error.message,
				userId,
			});
			return false;
		}

		return data as boolean;
	}

	/**
	 * Get missing mandatory consents
	 */
	async getMissingMandatoryConsents(userId: string): Promise<ConsentType[]> {
		// Get mandatory templates
		const { data: templates } = await this.supabase
			.from('consent_templates')
			.select('consent_type')
			.eq('is_mandatory', true)
			.eq('is_active', true);

		if (!templates || templates.length === 0) return [];

		const mandatoryTypes = templates.map(
			(t) => t.consent_type,
		) as ConsentType[];

		// Get user's active consents
		const { data: consents } = await this.supabase
			.from('lgpd_consents')
			.select('consent_type')
			.eq('user_id', userId)
			.eq('granted', true)
			.is('revoked_at', null);

		const grantedTypes = (consents ?? []).map(
			(c) => c.consent_type,
		) as ConsentType[];

		return mandatoryTypes.filter((type) => !grantedTypes.includes(type));
	}

	// ========================================
	// DATA EXPORT REQUESTS
	// ========================================

	/**
	 * Create a data export request
	 */
	async createExportRequest(
		userId: string,
		requestType: DataExportRequestType,
		format: DataExportFormat,
		dateFrom?: string,
		dateTo?: string,
		ipAddress?: string,
	): Promise<DataExportRequest> {
		const { data, error } = await this.supabase
			.from('data_export_requests')
			.insert({
				user_id: userId,
				request_type: requestType,
				format,
				status: 'pending',
				date_from: dateFrom ?? null,
				date_to: dateTo ?? null,
				requested_via: 'app',
				ip_address: ipAddress,
			})
			.select()
			.single();

		if (error) {
			secureLogger.error('Failed to create export request', {
				error: error.message,
				userId,
			});
			throw new Error(
				`Erro ao criar solicitação de exportação: ${error.message}`,
			);
		}

		// Log compliance event
		await this.logComplianceEvent(
			userId,
			'data_export_requested',
			'data_export_requests',
			data.id,
			`Export request created: ${requestType} in ${format} format`,
		);

		secureLogger.info('Export request created', {
			userId,
			requestId: data.id,
			requestType,
		});
		return data as unknown as DataExportRequest;
	}

	/**
	 * Get user's export requests
	 */
	async getExportRequests(userId: string): Promise<DataExportRequest[]> {
		const { data, error } = await this.supabase
			.from('data_export_requests')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			secureLogger.error('Failed to get export requests', {
				error: error.message,
				userId,
			});
			throw new Error(
				`Erro ao buscar solicitações de exportação: ${error.message}`,
			);
		}

		return (data ?? []) as unknown as DataExportRequest[];
	}

	// ========================================
	// DATA DELETION REQUESTS
	// ========================================

	/**
	 * Create a data deletion request
	 */
	async createDeletionRequest(
		userId: string,
		requestType: DataDeletionRequestType,
		scope?: Record<string, unknown>,
		reason?: string,
		ipAddress?: string,
	): Promise<DataDeletionRequest> {
		// Check for legal holds
		const { data: hasHold } = await this.supabase
			.from('data_deletion_requests')
			.select('id')
			.eq('user_id', userId)
			.eq('legal_hold', true)
			.eq('status', 'approved')
			.limit(1);

		if (hasHold && hasHold.length > 0) {
			throw new Error(
				'Seus dados estão sob retenção legal e não podem ser excluídos no momento.',
			);
		}

		// Calculate review deadline (15 days per LGPD)
		const reviewDeadline = new Date();
		reviewDeadline.setDate(reviewDeadline.getDate() + 15);

		// Generate verification code
		const verificationCode = Math.random()
			.toString(36)
			.substring(2, 8)
			.toUpperCase();

		const { data, error } = await this.supabase
			.from('data_deletion_requests')
			.insert({
				user_id: userId,
				request_type: requestType,
				scope: scope ?? {},
				reason: reason ?? null,
				status: 'pending',
				verification_code: verificationCode,
				review_deadline: reviewDeadline.toISOString(),
				ip_address: ipAddress,
			})
			.select()
			.single();

		if (error) {
			secureLogger.error('Failed to create deletion request', {
				error: error.message,
				userId,
			});
			throw new Error(
				`Erro ao criar solicitação de exclusão: ${error.message}`,
			);
		}

		// Log compliance event
		await this.logComplianceEvent(
			userId,
			'data_deletion_requested',
			'data_deletion_requests',
			data.id,
			`Deletion request created: ${requestType}`,
		);

		secureLogger.info('Deletion request created', {
			userId,
			requestId: data.id,
			requestType,
		});
		return data as unknown as DataDeletionRequest;
	}

	/**
	 * Get user's deletion requests
	 */
	async getDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
		const { data, error } = await this.supabase
			.from('data_deletion_requests')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			secureLogger.error('Failed to get deletion requests', {
				error: error.message,
				userId,
			});
			throw new Error(
				`Erro ao buscar solicitações de exclusão: ${error.message}`,
			);
		}

		return (data ?? []) as unknown as DataDeletionRequest[];
	}

	// ========================================
	// TRANSACTION LIMITS
	// ========================================

	/**
	 * Get user's transaction limits
	 */
	async getTransactionLimits(userId: string): Promise<TransactionLimit[]> {
		const { data, error } = await this.supabase
			.from('transaction_limits')
			.select('*')
			.eq('user_id', userId)
			.eq('is_active', true)
			.order('limit_type', { ascending: true });

		if (error) {
			secureLogger.error('Failed to get transaction limits', {
				error: error.message,
				userId,
			});
			throw new Error(`Erro ao buscar limites de transação: ${error.message}`);
		}

		return (data ?? []) as unknown as TransactionLimit[];
	}

	/**
	 * Check if a transaction is within limits
	 */
	async checkTransactionLimit(
		userId: string,
		limitType: TransactionLimitType,
		amount: number,
	): Promise<CheckLimitResponse> {
		const { data: limit, error } = await this.supabase
			.from('transaction_limits')
			.select('*')
			.eq('user_id', userId)
			.eq('limit_type', limitType)
			.eq('is_active', true)
			.single();

		if (error && error.code !== 'PGRST116') {
			secureLogger.error('Failed to check limit', {
				error: error.message,
				userId,
				limitType,
			});
			throw new Error(`Erro ao verificar limite: ${error.message}`);
		}

		// No limit configured - allow transaction
		if (!limit) {
			return { allowed: true, remaining: Number.POSITIVE_INFINITY };
		}

		const typedLimit = limit as unknown as TransactionLimit;
		const remaining = typedLimit.daily_limit - typedLimit.current_daily_used;

		if (amount > remaining) {
			return {
				allowed: false,
				remaining,
				reason: `Limite diário excedido. Disponível: R$ ${remaining.toFixed(2)}`,
			};
		}

		return { allowed: true, remaining: remaining - amount };
	}

	/**
	 * Update limit usage after a transaction
	 */
	async updateLimitUsage(
		userId: string,
		limitType: TransactionLimitType,
		amount: number,
	): Promise<void> {
		const { error } = await this.supabase.rpc('update_limit_usage', {
			p_user_id: userId,
			p_limit_type: limitType,
			p_amount: amount,
		});

		if (error) {
			secureLogger.error('Failed to update limit usage', {
				error: error.message,
				userId,
				limitType,
			});
			throw new Error(`Erro ao atualizar uso do limite: ${error.message}`);
		}
	}

	// ========================================
	// AUDIT LOGGING
	// ========================================

	/**
	 * Log a compliance event
	 */
	async logComplianceEvent(
		userId: string,
		eventType: ComplianceEventType,
		resourceType: string,
		resourceId: string,
		description: string,
		metadata?: Record<string, unknown>,
		ipAddress?: string,
	): Promise<void> {
		const { error } = await this.supabase.from('compliance_audit_logs').insert({
			user_id: userId,
			event_type: eventType,
			resource_type: resourceType,
			resource_id: resourceId,
			description,
			metadata: metadata ?? {},
			ip_address: ipAddress,
		});

		if (error) {
			secureLogger.error('Failed to log compliance event', {
				error: error.message,
				eventType,
			});
		}
	}

	/**
	 * Get audit history for a user
	 */
	async getAuditHistory(
		userId: string,
		options?: {
			limit?: number;
			eventType?: string;
			startDate?: Date;
			endDate?: Date;
		},
	): Promise<unknown[]> {
		let query = this.supabase
			.from('compliance_audit_logs')
			.select('*')
			.eq('user_id', userId);

		if (options?.eventType) {
			query = query.eq('event_type', options.eventType);
		}
		if (options?.startDate) {
			query = query.gte('created_at', options.startDate.toISOString());
		}
		if (options?.endDate) {
			query = query.lte('created_at', options.endDate.toISOString());
		}

		query = query.order('created_at', { ascending: false });

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		const { data, error } = await query;

		if (error) {
			secureLogger.error('Failed to get audit history', {
				error: error.message,
				userId,
			});
			throw new Error(
				`Erro ao buscar histórico de auditoria: ${error.message}`,
			);
		}

		return data ?? [];
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Generate SHA-256 hash for consent text
	 */
	private async generateHash(text: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(text);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}
}

// Factory function
export function createComplianceService(
	supabase: SupabaseClientType,
): ComplianceService {
	return new ComplianceService(supabase);
}
