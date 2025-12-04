/**
 * AI Consent Verification
 *
 * LGPD-compliant consent management for AI financial analysis.
 * Uses the 'financial_data' consent type from the existing LGPD schema.
 */

import { and, eq } from 'drizzle-orm';

import { lgpdConsents } from '@/db/schema';
import { logger } from '@/lib/logging';
import type { DbClient } from '@/server/hono-types';

// Use existing consent type for AI financial analysis
const AI_CONSENT_TYPE = 'financial_data' as const;
const AI_CONSENT_VERSION = '1.0';
const AI_CONSENT_PURPOSE = 'AI financial analysis and personalized recommendations';
const AI_CONSENT_LEGAL_BASIS = 'consent'; // LGPD Art. 7, I

export interface AIConsentStatus {
	hasConsent: boolean;
	consentedAt: Date | null;
	version: string | null;
}

/**
 * Verify if user has granted AI financial analysis consent
 */
export async function verifyAIConsent(userId: string, db: DbClient): Promise<boolean> {
	try {
		const [consent] = await db
			.select({
				granted: lgpdConsents.granted,
				consentVersion: lgpdConsents.consentVersion,
			})
			.from(lgpdConsents)
			.where(
				and(
					eq(lgpdConsents.userId, userId),
					eq(lgpdConsents.consentType, AI_CONSENT_TYPE),
					eq(lgpdConsents.granted, true),
				),
			)
			.limit(1);

		return !!consent;
	} catch {
		return false;
	}
}

/**
 * Get detailed consent status
 */
export async function getAIConsentStatus(userId: string, db: DbClient): Promise<AIConsentStatus> {
	try {
		const [consent] = await db
			.select({
				granted: lgpdConsents.granted,
				grantedAt: lgpdConsents.grantedAt,
				consentVersion: lgpdConsents.consentVersion,
			})
			.from(lgpdConsents)
			.where(and(eq(lgpdConsents.userId, userId), eq(lgpdConsents.consentType, AI_CONSENT_TYPE)))
			.limit(1);

		if (!consent?.granted) {
			return {
				hasConsent: false,
				consentedAt: null,
				version: null,
			};
		}

		return {
			hasConsent: true,
			consentedAt: consent.grantedAt,
			version: consent.consentVersion,
		};
	} catch (err) {
		logger.error('[AI Consent] Failed to get consent status', {
			error: err instanceof Error ? err.message : String(err),
			userId,
		});
		return {
			hasConsent: false,
			consentedAt: null,
			version: null,
		};
	}
}

/**
 * Grant AI financial analysis consent
 */
export async function grantAIConsent(
	userId: string,
	db: DbClient,
	options?: {
		ipAddress?: string;
		userAgent?: string;
	},
): Promise<{ success: boolean; error?: string }> {
	try {
		// Check if consent already exists
		const existing = await db
			.select({ id: lgpdConsents.id })
			.from(lgpdConsents)
			.where(and(eq(lgpdConsents.userId, userId), eq(lgpdConsents.consentType, AI_CONSENT_TYPE)))
			.limit(1);

		if (existing.length > 0) {
			// Reactivate existing consent
			await db
				.update(lgpdConsents)
				.set({
					granted: true,
					grantedAt: new Date(),
					consentVersion: AI_CONSENT_VERSION,
					revokedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(lgpdConsents.id, existing[0].id));
		} else {
			// Create new consent
			await db.insert(lgpdConsents).values({
				userId,
				consentType: AI_CONSENT_TYPE,
				consentVersion: AI_CONSENT_VERSION,
				purpose: AI_CONSENT_PURPOSE,
				legalBasis: AI_CONSENT_LEGAL_BASIS,
				granted: true,
				grantedAt: new Date(),
				collectionMethod: 'settings_toggle',
				ipAddress: options?.ipAddress,
				userAgent: options?.userAgent,
			});
		}

		return { success: true };
	} catch (err) {
		logger.error('[AI Consent] Failed to grant consent', {
			error: err instanceof Error ? err.message : String(err),
			userId,
		});
		return {
			success: false,
			error: 'Falha ao registrar consentimento. Tente novamente.',
		};
	}
}

/**
 * Revoke AI financial analysis consent
 */
export async function revokeAIConsent(
	userId: string,
	db: DbClient,
): Promise<{ success: boolean; error?: string }> {
	try {
		await db
			.update(lgpdConsents)
			.set({
				granted: false,
				revokedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(eq(lgpdConsents.userId, userId), eq(lgpdConsents.consentType, AI_CONSENT_TYPE)));

		return { success: true };
	} catch (err) {
		logger.error('[AI Consent] Failed to revoke consent', {
			error: err instanceof Error ? err.message : String(err),
			userId,
		});
		return {
			success: false,
		};
	}
}

/**
 * Consent information for display to users
 */
export const AI_CONSENT_INFO = {
	title: 'Assistente Financeiro Inteligente',
	description:
		'Nosso assistente de IA analisa seus dados financeiros para fornecer sugestões personalizadas de economia, controle de gastos e planejamento financeiro.',
	dataAccessed: [
		'Saldos das suas contas',
		'Histórico de transações',
		'Orçamentos e limites definidos',
		'Metas financeiras cadastradas',
		'Pagamentos futuros agendados',
	],
	userRights: [
		'Revogar este consentimento a qualquer momento',
		'Seus dados não são compartilhados com terceiros',
		'Conversas não são armazenadas permanentemente',
		'Solicitar exclusão dos seus dados a qualquer momento',
	],
	version: AI_CONSENT_VERSION,
} as const;
