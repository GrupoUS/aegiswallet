import { createClerkClient, type WebhookEvent } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { Webhook } from 'svix';

import { getPoolClient } from '@/db/client';
import { subscriptions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { StripeCustomerService } from '@/services/stripe/customer.service';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

const clerkClient = createClerkClient({ secretKey: clerkSecretKey || '' });

const clerkWebhookHandler = new Hono<AppEnv>();

clerkWebhookHandler.post('/', async (c) => {
	if (!webhookSecret) {
		return c.json({ error: 'Webhook secret not configured' }, 500);
	}

	const payload = await c.req.text();
	const headers = {
		'svix-id': c.req.header('svix-id') || '',
		'svix-timestamp': c.req.header('svix-timestamp') || '',
		'svix-signature': c.req.header('svix-signature') || '',
	};

	let event: WebhookEvent;

	try {
		const wh = new Webhook(webhookSecret);
		event = wh.verify(payload, headers) as WebhookEvent;
	} catch (error) {
		secureLogger.error('Clerk webhook verification failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return c.json({ error: 'Invalid signature' }, 400);
	}

	const eventType = event.type;

	try {
		if (eventType === 'user.created') {
			const { id, email_addresses, first_name, last_name } = event.data;
			const email = email_addresses[0]?.email_address;
			const name =
				[first_name, last_name].filter(Boolean).join(' ') || undefined;

			if (!email) {
				secureLogger.warn('User created without email', { userId: id });
				return c.json({ error: 'No email found' }, 400);
			}

			// Create Stripe customer
			const stripeCustomerId = await StripeCustomerService.createCustomer(
				id,
				email,
				name,
			);

			// Update Clerk user metadata with stripeCustomerId
			await clerkClient.users.updateUserMetadata(id, {
				privateMetadata: {
					stripeCustomerId,
				},
			});

			// Create free subscription in database
			const db = getPoolClient();
			await db.insert(subscriptions).values({
				userId: id,
				stripeCustomerId,
				planId: 'free',
				status: 'free',
			});

			secureLogger.info('User created and initialized', {
				userId: id,
				stripeCustomerId,
			});
		} else if (eventType === 'user.deleted') {
			const { id } = event.data;
			const db = getPoolClient();

			// Find user's subscription
			if (!id) return c.json({ error: 'No user ID' }, 400);

			const [sub] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, id))
				.limit(1);

			if (sub?.stripeCustomerId) {
				// Cancel and delete Stripe customer (LGPD compliance)
				await StripeCustomerService.deleteCustomer(sub.stripeCustomerId);
			}

			// Delete subscription from database (cascade will handle related data)
			await db.delete(subscriptions).where(eq(subscriptions.userId, id));

			secureLogger.info('User deleted and data cleaned up', { userId: id });
		} else if (eventType === 'user.updated') {
			const { id, email_addresses, first_name, last_name } = event.data;
			const email = email_addresses[0]?.email_address;
			const name =
				[first_name, last_name].filter(Boolean).join(' ') || undefined;

			// Get user's subscription to find stripeCustomerId
			const db = getPoolClient();
			const [sub] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, id))
				.limit(1);

			if (sub?.stripeCustomerId && email) {
				// Update Stripe customer info
				await StripeCustomerService.updateCustomer(sub.stripeCustomerId, {
					email,
					name,
				});
			}

			secureLogger.info('User updated', { userId: id });
		}

		return c.json({ received: true });
	} catch (error) {
		secureLogger.error('Clerk webhook processing error', {
			eventType,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return c.json({ error: 'Webhook processing failed' }, 500);
	}
});

export default clerkWebhookHandler;
