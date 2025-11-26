/**
 * Cron Job: Cleanup Sync Queue
 * Schedule: Weekly on Sunday at 3 AM (0 3 * * 0)
 * Purpose: Remove old completed/failed sync queue items
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RETENTION_DAYS = 7;

export default async function handler(req: any, res: any) {
  // Only allow GET requests (Vercel cron uses GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret in production
  const cronSecret = req.headers['x-vercel-cron-secret'];
  if (process.env.VERCEL && process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Delete old completed items
    const { error: deleteCompletedError, count: completedCount } = await supabase
      .from('sync_queue')
      .delete({ count: 'exact' })
      .eq('status', 'completed')
      .lt('processed_at', cutoffDate);

    if (deleteCompletedError) {
      console.error('Error deleting completed items:', deleteCompletedError);
    }

    // Delete old failed items
    const { error: deleteFailedError, count: failedCount } = await supabase
      .from('sync_queue')
      .delete({ count: 'exact' })
      .eq('status', 'failed')
      .lt('processed_at', cutoffDate);

    if (deleteFailedError) {
      console.error('Error deleting failed items:', deleteFailedError);
    }

    // Also clean up old audit logs (older than 30 days)
    const auditCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deleteAuditError, count: auditCount } = await supabase
      .from('calendar_sync_audit')
      .delete({ count: 'exact' })
      .lt('created_at', auditCutoff);

    if (deleteAuditError) {
      console.error('Error deleting audit logs:', deleteAuditError);
    }

    const totalDeleted = (completedCount || 0) + (failedCount || 0);

    // Log cleanup result
    await supabase.from('calendar_sync_audit').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      action: 'sync_completed',
      details: {
        message: 'Weekly cleanup completed',
        completed_deleted: completedCount || 0,
        failed_deleted: failedCount || 0,
        audit_logs_deleted: auditCount || 0,
        retention_days: RETENTION_DAYS,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cleanup complete',
      deleted: {
        completed: completedCount || 0,
        failed: failedCount || 0,
        audit_logs: auditCount || 0,
        total: totalDeleted,
      },
      retention_days: RETENTION_DAYS,
    });
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

