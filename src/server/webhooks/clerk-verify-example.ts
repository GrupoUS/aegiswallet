/**
 * Example: Modern Clerk Webhook Handler using verifyWebhook
 *
 * Demonstrates the use of @clerk/backend/webhooks verifyWebhook function
 * This is an EXAMPLE - the actual implementation should handle database operations
 */

import { verifyWebhook, type WebhookEvent } from '@clerk/backend/webhooks';
import { Hono } from 'hono';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';

// Example webhook handler using modern verifyWebhook
const clerkWebhookExample = new Hono<AppEnv>();

clerkWebhookExample.post('/', async (c) => {
	const requestId = c.get('requestId') || crypto.randomUUID();

	try {
		// Verify webhook using Clerk's verifyWebhook function
		// Automatically handles signature verification and gets the signing secret from environment
		const evt: WebhookEvent = await verifyWebhook(c.req.raw);

		secureLogger.info('Clerk webhook received and verified', {
			requestId,
			eventType: evt.type,
			eventId: evt.data?.id,
		});

		// Process the event based on type
		switch (evt.type) {
			case 'user.created':
				secureLogger.info('Processing user.created', {
					requestId,
					userId: evt.data.id,
					email: evt.data.email_addresses?.[0]?.email_address,
				});
				// TODO: Create user in database, create Stripe customer, etc.
				break;

			case 'user.updated':
				secureLogger.info('Processing user.updated', {
					requestId,
					userId: evt.data.id,
					email: evt.data.email_addresses?.[0]?.email_address,
				});
				// TODO: Update user in database, update Stripe customer, etc.
				break;

			case 'user.deleted':
				secureLogger.info('Processing user.deleted', {
					requestId,
					userId: evt.data.id,
				});
				// TODO: Delete user from database, delete Stripe customer, etc. (LGPD compliance)
				break;

			default:
				secureLogger.info('Unhandled webhook event type', {
					requestId,
					eventType: evt.type,
				});
				break;
		}

		return c.json({ received: true });
	} catch (error) {
		secureLogger.error('Clerk webhook verification failed', {
			requestId,
			error: error instanceof Error ? error.message : 'Unknown error',
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		return c.json({ error: 'Webhook verification failed' }, 400);
	}
});

export default clerkWebhookExample;
export { clerkWebhookExample };
