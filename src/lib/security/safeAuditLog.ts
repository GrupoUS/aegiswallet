/**
 * Safe Audit Log Helper
 * Ensures audit logs are only inserted when user is authenticated
 * and handles errors gracefully to avoid breaking the application
 *
 * NOTE: Uses API-based logging with NeonDB
 */

import { apiClient } from '@/lib/api-client';
import logger from '@/lib/logging/secure-logger';

export interface SafeAuditLogData {
	action: string;
	resource_type?: string;
	resource_id?: string;
	details?: Record<string, unknown>;
	old_values?: Record<string, unknown>;
	new_values?: Record<string, unknown>;
	ip_address?: string;
	user_agent?: string;
	success?: boolean;
	error_message?: string;
	user_id?: string | null; // Optional - will use authenticated user if not provided
}

/**
 * Safely insert an audit log entry via API
 * Returns true if successful, false otherwise
 */
export async function safeInsertAuditLog(
	data: SafeAuditLogData,
): Promise<boolean> {
	try {
		// Call the compliance API to log the audit entry
		await apiClient.post('/v1/compliance/audit-log', {
			action: data.action,
			resourceType: data.resource_type,
			resourceId: data.resource_id,
			details: data.details ?? null,
			oldValues: data.old_values ?? null,
			newValues: data.new_values ?? null,
			ipAddress: data.ip_address,
			userAgent: data.user_agent,
			success: data.success ?? true,
			errorMessage: data.error_message,
		});

		return true;
	} catch (error) {
		// Silently handle errors to avoid breaking the application
		logger.error('Error inserting audit log', {
			component: 'safeAuditLog',
			action: 'safeInsertAuditLog',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return false;
	}
}
