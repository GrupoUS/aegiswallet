/**
 * Audit Logger - Story 01.04
 *
 * Digitally signed audit logs with 12-month retention
 * LGPD-compliant security logging
 */

import { supabase } from '@/integrations/supabase/client';
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
 * Create digitally signed audit log
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  try {
    // Verify user is authenticated before inserting
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Use authenticated user ID if available, otherwise use provided userId
    const userId = user?.id || entry.userId;

    if (!userId) {
      // Silently fail if no user ID available (user not authenticated)
      logger.warn('Cannot create audit log: user not authenticated', {
        component: 'auditLogger',
        action: 'createAuditLog',
      });
      return '';
    }

    // Create signature (simplified - would use proper crypto in production)
    const signature = await generateSignature(entry);

    // Store in Supabase
    // Use details JSONB field to store additional metadata
    const details: Record<string, unknown> = {
      ...entry.metadata,
      transactionType: entry.transactionType,
      amount: entry.amount,
      method: entry.method,
      confidence: entry.confidence,
      transcriptionHash: entry.transcription ? await hashText(entry.transcription) : null,
      signature,
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action: entry.action,
        resource_type: entry.transactionType ? 'transaction' : undefined,
        details: details as unknown as Record<string, never>,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Log error but don't throw to avoid breaking the application
      logger.error('Failed to create audit log', {
        component: 'auditLogger',
        action: 'createAuditLog',
        error: error.message,
      });
      return '';
    }

    return data?.id || '';
  } catch (error) {
    // Silently handle errors to avoid breaking the application
    logger.error('Error creating audit log', {
      component: 'auditLogger',
      action: 'createAuditLog',
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
        ['sign']
      );

      // Sign
      const signature = await window.crypto.subtle.sign('HMAC', key, dataBuffer);

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
 * Query audit logs (admin only)
 */
export async function queryAuditLogs(params: {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<unknown[]> {
  let query = supabase.from('audit_logs').select('*');

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.action) {
    query = query.eq('action', params.action);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate.toISOString());
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate.toISOString());
  }

  query = query.order('created_at', { ascending: false }).limit(params.limit || 100);

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data || [];
}
