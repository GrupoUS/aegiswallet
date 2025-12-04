import { and, eq } from 'drizzle-orm';

import {
	AI_CONSENT_LEGAL_BASIS,
	AI_CONSENT_PURPOSE,
	AI_CONSENT_TYPE,
	AI_CONSENT_VERSION,
} from './constants';
import type { DbClient } from '@/db/client';
import { lgpdConsents } from '@/db/schema';
import { logger } from '@/lib/logging';

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
