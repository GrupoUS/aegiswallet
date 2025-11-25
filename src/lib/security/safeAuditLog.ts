/**
 * Safe Audit Log Helper
 * Ensures audit logs are only inserted when user is authenticated
 * and handles errors gracefully to avoid breaking the application
 */

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logging/secure-logger';
import type { Json } from '@/types/database.types';

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
 * Safely insert an audit log entry
 * Returns true if successful, false otherwise
 */
export async function safeInsertAuditLog(data: SafeAuditLogData): Promise<boolean> {
  try {
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine user_id: use provided, authenticated user, or null for system logs
    const userId = data.user_id !== undefined ? data.user_id : user?.id || null;

    // If user_id is required but not available, skip logging
    // (This prevents 401 errors when user is not authenticated)
    if (userId === null && data.user_id !== null) {
      // Only log if explicitly allowed to log system events (user_id: null)
      // Otherwise, silently skip to avoid errors
      return false;
    }

    // Insert audit log
    const { error } = await supabase.from('audit_logs').insert({
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      details: (data.details as Json) ?? null,
      old_values: (data.old_values as Json) ?? null,
      new_values: (data.new_values as Json) ?? null,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      success: data.success ?? true,
      error_message: data.error_message,
      user_id: userId,
    });

    if (error) {
      // Log error but don't throw to avoid breaking the application
      logger.error('Failed to insert audit log', {
        component: 'safeAuditLog',
        action: 'safeInsertAuditLog',
        error: error.message,
      });
      return false;
    }

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
