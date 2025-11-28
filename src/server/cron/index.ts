/**
 * Cron Jobs Index
 * Centralizes all cron job routes for Vercel deployment
 */

import { Hono } from 'hono';

import calendarChannelRenewal from './calendar-channel-renewal';
import cleanupSyncQueue from './cleanup-sync-queue';
import syncQueueProcessor from './sync-queue-processor';
import type { AppEnv } from '@/server/hono-types';

const cronApp = new Hono<AppEnv>();

// Register all cron job routes
// Each cron job is accessible via: /cron/{job-name}
cronApp.route('/calendar-channel-renewal', calendarChannelRenewal);
cronApp.route('/sync-queue-processor', syncQueueProcessor);
cronApp.route('/cleanup-sync-queue', cleanupSyncQueue);

// Health check for cron service
cronApp.get('/health', (c) => {
	return c.json({
		status: 'healthy',
		service: 'cron-jobs',
		timestamp: new Date().toISOString(),
		jobs: [
			{
				name: 'calendar-channel-renewal',
				schedule: '0 0 * * *',
				description: 'Renew expiring Google Calendar webhook channels',
			},
			{
				name: 'sync-queue-processor',
				schedule: '*/5 * * * *',
				description: 'Process pending Google Calendar sync queue items',
			},
			{
				name: 'cleanup-sync-queue',
				schedule: '0 2 * * *',
				description: 'Clean up old completed/failed sync queue items',
			},
		],
	});
});

export default cronApp;
