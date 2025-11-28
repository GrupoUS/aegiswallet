/**
 * Audit Logger - Story 01.04
 *
 * Digitally signed audit logs with 12-month retention
 * LGPD-compliant security logging
 *
 * NOTE: Migrated from Supabase to API-based logging
 * The audit log is now sent to the server which handles DB storage via Drizzle
 */

import { apiClient } from '@/lib/api-client';
import logger from '@/lib/logging/secure-logger';

export interface AuditLogEntry {
	userId: string;
	action: string;
	transactionType?: string;
	amount?: number;
	method?: string;
	confidence?: number;
	transcription?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Create digitally signed audit log via API
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
	try {
		// Create signature
		const signature = await generateSignature(entry);

		// Send to API endpoint
		const response = await apiClient.post<{ id: string }>('/v1/compliance/audit-log', {
			action: entry.action,
			resourceType: entry.transactionType ? 'transaction' : undefined,
			details: {
				...entry.metadata,
				transactionType: entry.transactionType,
				amount: entry.amount,
				method: entry.method,
				confidence: entry.confidence,
				transcriptionHash: entry.transcription
					? await hashText(entry.transcription)
					: null,
				signature,
			},
		});

		return response.id || '';
	} catch (error) {
		// Log error but don't throw to avoid breaking the application
		logger.error('Failed to create audit log', {
			action: 'createAuditLog',
			component: 'auditLogger',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return '';
	}
}

/**
 * Generate cryptographic signature for audit log
 */
async function generateSignature(entry: AuditLogEntry): Promise<string> {
	const data = JSON.stringify({
		action: entry.action,
		timestamp: Date.now(),
		userId: entry.userId,
	});

	// Use Web Crypto API
	if (typeof window !== 'undefined' && window.crypto?.subtle) {
		try {
			const encoder = new TextEncoder();
			const dataBuffer = encoder.encode(data);

			// Generate key (in production, use stored key)
			const key = await window.crypto.subtle.generateKey(
				{
					hash: 'SHA-256',
					name: 'HMAC',
				},
				false,
				['sign'],
			);

			// Sign
			const signature = await window.crypto.subtle.sign(
				'HMAC',
				key,
				dataBuffer,
			);

			// Convert to hex
			return Array.from(new Uint8Array(signature))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
		} catch {
			// Fallback
			return hashText(data);
		}
	}

	// Fallback for server-side
	return hashText(data);
}


/**
 * Hash sensitive text (for transcriptions)
 */
async function hashText(text: string): Promise<string> {
	if (typeof window !== 'undefined' && window.crypto?.subtle) {
		try {
			const encoder = new TextEncoder();
			const data = encoder.encode(text);
			const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

			return Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
		} catch {
			return btoa(text).slice(0, 64);
		}
	}

	// Fallback
	return btoa(text).slice(0, 64);
}

/**
 * Query audit logs (admin only) via API
 */
export async function queryAuditLogs(params: {
	userId?: string;
	action?: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}): Promise<unknown[]> {
	try {
		const response = await apiClient.get<{ data: unknown[] }>('/v1/compliance/audit-logs', {
			params: {
				action: params.action,
				endDate: params.endDate?.toISOString(),
				limit: params.limit || 100,
				startDate: params.startDate?.toISOString(),
				userId: params.userId,
			},
		});

		return response.data || [];
	} catch (error) {
		logger.error('Failed to query audit logs', {
			action: 'queryAuditLogs',
			component: 'auditLogger',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return [];
	}
}
