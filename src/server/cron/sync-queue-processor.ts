/**
 * Cron Job: Sync Queue Processor
 * Schedule: Every 5 minutes (* /5 * * * *)
 * Purpose: Process pending sync queue items for Google Calendar sync
 */

import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';

import type { AppEnv } from '@/server/hono-types';

const app = new Hono<AppEnv>();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_ITEMS_PER_RUN = 50;
const MAX_RETRIES = 3;

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
		// Fetch pending items, oldest first
		const { data: pendingItems, error: fetchError } = await supabase
			.from('sync_queue')
			.select('*')
			.eq('status', 'pending')
			.lt('retry_count', MAX_RETRIES)
			.order('created_at', { ascending: true })
			.limit(MAX_ITEMS_PER_RUN);

		if (fetchError) {
			console.error('Error fetching sync queue:', fetchError);
			return c.json(
				{ error: 'Database error', details: fetchError.message },
				500,
			);
		}

		if (!pendingItems || pendingItems.length === 0) {
			return c.json({
				success: true,
				message: 'No pending items in queue',
				processed: 0,
			});
		}

		let processed = 0;
		let failed = 0;
		const errors: string[] = [];

		// Process each item
		for (const item of pendingItems) {
			try {
				// Mark as processing
				await supabase
					.from('sync_queue')
					.update({ status: 'processing' })
					.eq('id', item.id);

				// Determine which action to call
				const action =
					item.sync_direction === 'to_google'
						? 'sync_to_google'
						: 'sync_from_google';
				const payload =
					item.sync_direction === 'to_google'
						? { event_id: item.event_id }
						: { google_event_id: item.event_id };

				// Get user's auth token (service role can impersonate)
				const syncResponse = await fetch(
					`${SUPABASE_URL}/functions/v1/google-calendar-sync?action=${action}`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
							'Content-Type': 'application/json',
							'x-user-id': item.user_id,
						},
						body: JSON.stringify(payload),
					},
				);

				if (syncResponse.ok) {
					// Mark as completed
					await supabase
						.from('sync_queue')
						.update({
							status: 'completed',
							processed_at: new Date().toISOString(),
						})
						.eq('id', item.id);

					processed++;
				} else {
					const errorText = await syncResponse.text();
					throw new Error(errorText);
				}
			} catch (err) {
				failed++;
				const errorMessage =
					err instanceof Error ? err.message : 'Unknown error';
				errors.push(`Item ${item.id}: ${errorMessage}`);

				// Update retry count and error message
				const newRetryCount = item.retry_count + 1;
				await supabase
					.from('sync_queue')
					.update({
						status: newRetryCount >= MAX_RETRIES ? 'failed' : 'pending',
						retry_count: newRetryCount,
						error_message: errorMessage,
						processed_at:
							newRetryCount >= MAX_RETRIES ? new Date().toISOString() : null,
					})
					.eq('id', item.id);
			}
		}

		return c.json({
			success: true,
			message: 'Sync queue processing complete',
			processed,
			failed,
			remaining: pendingItems.length - processed - failed,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error('Sync queue processor error:', error);
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
