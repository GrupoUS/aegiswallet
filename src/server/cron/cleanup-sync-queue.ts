/**
 * Cron Job: Cleanup Sync Queue
 * Schedule: Daily at 2 AM (0 2 * * *)
 * Purpose: Clean up old completed/failed sync queue items
 */

import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';

import type { AppEnv } from '@/server/hono-types';

const app = new Hono<AppEnv>();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLEANUP_DAYS = 7; // Delete items older than 7 days

// Vercel cron handler
app.get('/', async (c) => {
	// Verify cron secret in production
	const cronSecret = c.req.header('x-vercel-cron-secret');
	if (
		process.env.VERCEL &&
		process.env.CRON_SECRET &&
		cronSecret !== process.env.CRON_SECRET
	) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
		console.error('Missing Supabase configuration');
		return c.json({ error: 'Server configuration error' }, 500);
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

	try {
		// Calculate cutoff date
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
		const cutoffIso = cutoffDate.toISOString();

		// Delete old completed items
		const { data: completedResult, error: completedError } = await supabase
			.from('sync_queue')
			.delete()
			.eq('status', 'completed')
			.lt('processed_at', cutoffIso)
			.select('id');

		if (completedError) {
			console.error('Error deleting completed items:', completedError);
			return c.json(
				{ error: 'Database error', details: completedError.message },
				500,
			);
		}

		// Delete old failed items
		const { data: failedResult, error: failedError } = await supabase
			.from('sync_queue')
			.delete()
			.eq('status', 'failed')
			.lt('processed_at', cutoffIso)
			.select('id');

		if (failedError) {
			console.error('Error deleting failed items:', failedError);
			return c.json(
				{ error: 'Database error', details: failedError.message },
				500,
			);
		}

		const totalDeleted =
			(completedResult?.length || 0) + (failedResult?.length || 0);

		return c.json({
			success: true,
			message: `Cleanup complete`,
			deleted_completed: completedResult?.length || 0,
			deleted_failed: failedResult?.length || 0,
			total_deleted: totalDeleted,
			cutoff_date: cutoffIso,
		});
	} catch (error) {
		console.error('Cleanup cron error:', error);
		return c.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			500,
		);
	}
});

export default app;
