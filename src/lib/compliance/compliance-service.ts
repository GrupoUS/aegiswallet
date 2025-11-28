/**
 * LGPD Compliance Service
 * Manages consent, data export, deletion requests, and transaction limits
 */

import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import type { HttpClient } from '@/db/client';
import {
	complianceAuditLogs,
	consentTemplates,
	dataDeletionRequests,
	lgpdConsents,
	lgpdExportRequests,
	transactionLimits,
} from '@/db/schema';
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

export class ComplianceService {
	constructor(private db: HttpClient) {}

	// ========================================
	// CONSENT MANAGEMENT
	// ========================================

	/**
	 * Get all consents for a user
	 */
	async getUserConsents(userId: string): Promise<LgpdConsent[]> {
		try {
			const data = await this.db
				.select()
				.from(lgpdConsents)
				.where(eq(lgpdConsents.userId, userId))
				.orderBy(desc(lgpdConsents.createdAt));

			return data as unknown as LgpdConsent[];
		} catch (error) {
			secureLogger.error('Failed to get user consents', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar consentimentos: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Get active consent templates
	 */
	async getConsentTemplates(): Promise<ConsentTemplate[]> {
		try {
			const data = await this.db
				.select()
				.from(consentTemplates)
				.where(eq(consentTemplates.isActive, true))
				.orderBy(consentTemplates.consentType);

			return data as unknown as ConsentTemplate[];
		} catch (error) {
			secureLogger.error('Failed to get consent templates', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(
				`Erro ao buscar templates de consentimento: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
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
		try {
			// Get the template for this consent type
			const [template] = await this.db
				.select()
				.from(consentTemplates)
				.where(
					and(
						eq(consentTemplates.consentType, consentType),
						eq(consentTemplates.isActive, true),
					),
				)
				.limit(1);

			if (!template) {
				throw new Error(
					`Template de consentimento não encontrado: ${consentType}`,
				);
			}

			// Generate hash of consent text
			const consentTextHash = await this.generateHash(template.fullTextPt);

			// Check if consent already exists
			const [existing] = await this.db
				.select()
				.from(lgpdConsents)
				.where(
					and(
						eq(lgpdConsents.userId, userId),
						eq(lgpdConsents.consentType, consentType),
					),
				)
				.limit(1);

			if (existing) {
				// Update existing consent
				const [updated] = await this.db
					.update(lgpdConsents)
					.set({
						granted: true,
						grantedAt: new Date(),
						revokedAt: null,
						consentVersion: template.version,
						consentTextHash,
						collectionMethod,
						ipAddress: ipAddress ?? null,
						userAgent: userAgent ?? null,
					})
					.where(eq(lgpdConsents.id, existing.id))
					.returning();

				return updated as unknown as LgpdConsent;
			}

			// Create new consent
			const [newConsent] = await this.db
				.insert(lgpdConsents)
				.values({
					userId,
					consentType,
					purpose: template.descriptionPt,
					legalBasis: 'consent',
					granted: true,
					grantedAt: new Date(),
					revokedAt: null,
					consentVersion: template.version,
					consentTextHash,
					collectionMethod,
					ipAddress: ipAddress ?? null,
					userAgent: userAgent ?? null,
				})
				.returning();

			return newConsent as unknown as LgpdConsent;
		} catch (error) {
			secureLogger.error('Failed to grant consent', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				consentType,
			});
			throw new Error(
				`Erro ao conceder consentimento: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Revoke a consent
	 */
	async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
		try {
			await this.db
				.update(lgpdConsents)
				.set({
					granted: false,
					revokedAt: new Date(),
				})
				.where(
					and(
						eq(lgpdConsents.userId, userId),
						eq(lgpdConsents.consentType, consentType),
					),
				);
		} catch (error) {
			secureLogger.error('Failed to revoke consent', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				consentType,
			});
			throw new Error(
				`Erro ao revogar consentimento: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Check if user has required consents
	 */
	async checkRequiredConsents(
		userId: string,
		requiredConsents: ConsentType[],
	): Promise<boolean> {
		try {
			const data = await this.db
				.select()
				.from(lgpdConsents)
				.where(
					and(
						eq(lgpdConsents.userId, userId),
						inArray(lgpdConsents.consentType, requiredConsents),
						eq(lgpdConsents.granted, true),
					),
				);

			return data.length === requiredConsents.length;
		} catch (error) {
			secureLogger.error('Failed to check required consents', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			return false;
		}
	}

	/**
	 * Get missing mandatory consents
	 */
	async getMissingMandatoryConsents(userId: string): Promise<ConsentType[]> {
		try {
			// Get all mandatory templates
			const templates = await this.db
				.select()
				.from(consentTemplates)
				.where(
					and(
						eq(consentTemplates.isMandatory, true),
						eq(consentTemplates.isActive, true),
					),
				);

			const mandatoryTypes = templates.map((t) => t.consentType as ConsentType);

			// Get granted consents
			const grantedConsents = await this.db
				.select()
				.from(lgpdConsents)
				.where(
					and(eq(lgpdConsents.userId, userId), eq(lgpdConsents.granted, true)),
				);

			const grantedTypes = grantedConsents.map(
				(c) => c.consentType as ConsentType,
			);

			// Return missing consents
			return mandatoryTypes.filter((type) => !grantedTypes.includes(type));
		} catch (error) {
			secureLogger.error('Failed to get missing mandatory consents', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar consentimentos obrigatórios faltantes: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	// ========================================
	// DATA EXPORT
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
		try {
			const [request] = await this.db
				.insert(lgpdExportRequests)
				.values({
					userId,
					requestType,
					format,
					status: 'pending',
					dateFrom: dateFrom ?? null,
					dateTo: dateTo ?? null,
					requestedVia: 'app',
					ipAddress: ipAddress ?? null,
				})
				.returning();

			// Log audit event
			await this.logAuditEvent(
				userId,
				'data_export_requested',
				'data_export_requests',
				request.id,
				{ requestType, format },
			);

			return request as unknown as DataExportRequest;
		} catch (error) {
			secureLogger.error('Failed to create export request', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao criar solicitação de exportação: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Get user's export requests
	 */
	async getExportRequests(userId: string): Promise<DataExportRequest[]> {
		try {
			const data = await this.db
				.select()
				.from(lgpdExportRequests)
				.where(eq(lgpdExportRequests.userId, userId))
				.orderBy(desc(lgpdExportRequests.createdAt));

			return data as unknown as DataExportRequest[];
		} catch (error) {
			secureLogger.error('Failed to get export requests', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar solicitações de exportação: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	// ========================================
	// DATA DELETION
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
		try {
			// Check for legal hold
			const [existingHold] = await this.db
				.select({ legalHold: dataDeletionRequests.legalHold })
				.from(dataDeletionRequests)
				.where(
					and(
						eq(dataDeletionRequests.userId, userId),
						eq(dataDeletionRequests.legalHold, true),
					),
				)
				.limit(1);

			if (existingHold?.legalHold) {
				throw new Error(
					'Seus dados estão em retenção legal e não podem ser excluídos no momento',
				);
			}

			// Calculate review deadline (15 days per LGPD)
			const reviewDeadline = new Date();
			reviewDeadline.setDate(reviewDeadline.getDate() + 15);

			const [request] = await this.db
				.insert(dataDeletionRequests)
				.values({
					userId,
					requestType,
					scope: scope ?? {},
					reason: reason ?? null,
					status: 'pending',
					reviewDeadline,
					ipAddress: ipAddress ?? null,
				})
				.returning();

			// Log audit event
			await this.logAuditEvent(
				userId,
				'data_deletion_requested',
				'data_deletion_requests',
				request.id,
				{ requestType },
			);

			return request as unknown as DataDeletionRequest;
		} catch (error) {
			secureLogger.error('Failed to create deletion request', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get user's deletion requests
	 */
	async getDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
		try {
			const data = await this.db
				.select()
				.from(dataDeletionRequests)
				.where(eq(dataDeletionRequests.userId, userId))
				.orderBy(desc(dataDeletionRequests.createdAt));

			return data as unknown as DataDeletionRequest[];
		} catch (error) {
			secureLogger.error('Failed to get deletion requests', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar solicitações de exclusão: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	// ========================================
	// TRANSACTION LIMITS
	// ========================================

	/**
	 * Get user's transaction limits
	 */
	async getTransactionLimits(userId: string): Promise<TransactionLimit[]> {
		try {
			const data = await this.db
				.select()
				.from(transactionLimits)
				.where(eq(transactionLimits.userId, userId));

			return data as unknown as TransactionLimit[];
		} catch (error) {
			secureLogger.error('Failed to get transaction limits', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar limites de transação: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Check if a transaction is within limits
	 */
	async checkTransactionLimit(
		userId: string,
		limitType: TransactionLimitType,
		amount: number,
	): Promise<CheckLimitResponse> {
		try {
			const [limit] = await this.db
				.select()
				.from(transactionLimits)
				.where(
					and(
						eq(transactionLimits.userId, userId),
						eq(transactionLimits.limitType, limitType),
						eq(transactionLimits.isActive, true),
					),
				)
				.limit(1);

			if (!limit) {
				return { allowed: true };
			}

			const dailyLimit = Number(limit.dailyLimit);
			const currentUsed = Number(limit.currentDailyUsed ?? 0);
			const perTransactionLimit = limit.transactionLimit
				? Number(limit.transactionLimit)
				: null;
			const availableAmount = dailyLimit - currentUsed;

			// Check per-transaction limit
			if (perTransactionLimit && amount > perTransactionLimit) {
				return {
					allowed: false,
					reason: `Valor excede limite por transação de R$ ${perTransactionLimit.toFixed(2)}`,
					limit: dailyLimit,
					used: currentUsed,
					requested: amount,
					remaining: availableAmount,
				};
			}

			// Check daily limit
			if (amount > availableAmount) {
				return {
					allowed: false,
					reason: `Valor excede saldo diário disponível de R$ ${availableAmount.toFixed(2)}`,
					limit: dailyLimit,
					used: currentUsed,
					requested: amount,
					remaining: availableAmount,
				};
			}

			return {
				allowed: true,
				limit: dailyLimit,
				used: currentUsed,
				requested: amount,
				remaining: availableAmount,
			};
		} catch (error) {
			secureLogger.error('Failed to check transaction limit', {
				error: error instanceof Error ? error.message : 'Unknown error',
				limitType,
				userId,
			});
			throw new Error(
				`Erro ao verificar limite de transação: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	/**
	 * Update limit usage after a transaction
	 */
	async updateLimitUsage(
		userId: string,
		limitType: TransactionLimitType,
		amount: number,
	): Promise<void> {
		try {
			await this.db
				.update(transactionLimits)
				.set({
					currentDailyUsed: sql`${transactionLimits.currentDailyUsed} + ${amount}`,
				})
				.where(
					and(
						eq(transactionLimits.userId, userId),
						eq(transactionLimits.limitType, limitType),
					),
				);
		} catch (error) {
			secureLogger.error('Failed to update limit usage', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				limitType,
				amount,
			});
			throw new Error(
				`Erro ao atualizar uso de limite: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	// ========================================
	// AUDIT LOGGING
	// ========================================

	/**
	 * Log a compliance event
	 */
	private async logAuditEvent(
		userId: string,
		eventType: ComplianceEventType,
		resourceType: string,
		resourceId: string,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		try {
			// Calculate retention until date (keep for 5 years per LGPD)
			const retentionUntil = new Date();
			retentionUntil.setFullYear(retentionUntil.getFullYear() + 5);

			await this.db.insert(complianceAuditLogs).values({
				userId,
				eventType,
				resourceType,
				resourceId: resourceId ?? null,
				description: (metadata?.action as string) ?? null,
				metadata: metadata ?? {},
				previousState: null,
				newState: null,
				ipAddress: null,
				userAgent: null,
				sessionId: null,
				retentionUntil,
			});
		} catch (error) {
			// Don't throw on audit log failure, just log it
			secureLogger.error('Failed to log audit event', {
				error: error instanceof Error ? error.message : 'Unknown error',
				eventType,
				userId,
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
		try {
			const conditions = [eq(complianceAuditLogs.userId, userId)];

			if (options?.eventType) {
				conditions.push(
					eq(
						complianceAuditLogs.eventType,
						options.eventType as ComplianceEventType,
					),
				);
			}

			if (options?.startDate) {
				conditions.push(gte(complianceAuditLogs.createdAt, options.startDate));
			}

			if (options?.endDate) {
				conditions.push(lte(complianceAuditLogs.createdAt, options.endDate));
			}

			const data = await this.db
				.select()
				.from(complianceAuditLogs)
				.where(conditions.length > 1 ? and(...conditions) : conditions[0])
				.orderBy(desc(complianceAuditLogs.createdAt))
				.limit(options?.limit ?? 100);

			return data;
		} catch (error) {
			secureLogger.error('Failed to get audit history', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw new Error(
				`Erro ao buscar histórico de auditoria: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
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
export function createComplianceService(db: HttpClient): ComplianceService {
	return new ComplianceService(db);
}
