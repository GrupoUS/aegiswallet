/**
 * Modern Clerk Webhook Handler using @clerk/backend verifyWebhook
 *
 * Alternative implementation using Clerk's verifyWebhook function
 * Simpler and more maintainable than manual svix verification
 */

import { verifyWebhook, type WebhookEvent } from '@clerk/backend/webhooks';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { getPoolClient } from '@/db/client';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/users';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { OrganizationService } from '@/services/organization.service';
import { StripeCustomerService } from '@/services/stripe/customer.service';

// Clerk webhook handler using modern verifyWebhook
const clerkWebhookHandlerModern = new Hono<AppEnv>();

// Process webhook events
clerkWebhookHandlerModern.post('/', async (c) => {
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

		// Process the event
		await processWebhookEvent(evt, c, requestId);

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

// Process individual webhook events
async function processWebhookEvent(evt: WebhookEvent, c: any, requestId: string) {
	const eventType = evt.type;

	switch (eventType) {
		case 'user.created':
			await handleUserCreated(evt, c, requestId);
			break;

		case 'user.updated':
			await handleUserUpdated(evt, c, requestId);
			break;

		case 'user.deleted':
			await handleUserDeleted(evt, c, requestId);
			break;

		default:
			secureLogger.info('Unhandled webhook event type', {
				requestId,
				eventType,
			});
			break;
	}
}

// Handle user creation
async function handleUserCreated(evt: WebhookEvent, c: any, requestId: string) {
	const { id, email_addresses, first_name, last_name } = evt.data;
	const email = email_addresses[0]?.email_address;
	const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

	if (!email) {
		secureLogger.warn('User created without email', { userId: id, requestId });
		return c.json({ error: 'No email found' }, 400);
	}

	// Validate email format
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		secureLogger.warn('Invalid email format', { userId: id, email, requestId });
		return c.json({ error: 'Invalid email format' }, 400);
	}

	// Validate clerkUserId format
	if (!id || !id.startsWith('user_')) {
		secureLogger.warn('Invalid Clerk user ID format', { userId: id, requestId });
		return c.json({ error: 'Invalid user ID format' }, 400);
	}

	// Check if user already exists (idempotency check)
	const poolDb = getPoolClient();
	const [existingUser] = await poolDb
		.select()
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	if (existingUser) {
		secureLogger.info('User already exists, skipping creation', {
			userId: id,
			email,
			organizationId: existingUser.organizationId,
			requestId,
		});
		return c.json({ received: true, message: 'User already exists' });
	}

	// Create Stripe customer (with idempotency via getOrCreateCustomer)
	let stripeCustomerId: string;
	try {
		stripeCustomerId = await StripeCustomerService.getOrCreateCustomer(id, email, name);
	} catch (stripeError) {
		secureLogger.error('Failed to create Stripe customer', {
			userId: id,
			email,
			requestId,
			error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
		});
		return c.json({ error: 'Failed to create Stripe customer' }, 500);
	}

	// Use transaction to ensure atomicity
	try {
		await poolDb.transaction(async (tx) => {
			// 1. Create organization for user (pass transaction to avoid nested transactions)
			const organizationId = await OrganizationService.createUserOrganization(
				id,
				email,
				name,
				tx,
			);

			// 2. Insert user record with organizationId
			await tx.insert(users).values({
				id,
				email,
				fullName: name,
				organizationId,
			});

			// 3. Create free subscription in database
			await tx.insert(subscriptions).values({
				userId: id,
				stripeCustomerId,
				planId: 'free',
				status: 'free',
			});

			secureLogger.info('User created and initialized', {
				userId: id,
				email,
				organizationId,
				stripeCustomerId,
				requestId,
			});
		});
	} catch (dbError) {
		secureLogger.error('Database operation failed during user creation', {
			userId: id,
			email,
			stripeCustomerId,
			requestId,
			error: dbError instanceof Error ? dbError.message : 'Unknown error',
			stack: dbError instanceof Error ? dbError.stack : undefined,
		});

		// Attempt to rollback Stripe customer creation
		try {
			await StripeCustomerService.deleteCustomer(stripeCustomerId);
		} catch (rollbackError) {
			secureLogger.error('Failed to rollback Stripe customer', {
				stripeCustomerId,
				requestId,
				error: rollbackError instanceof Error ? rollbackError.message : 'Unknown error',
			});
		}

		return c.json({ error: 'Failed to create user record' }, 500);
	}
}

// Handle user deletion
async function handleUserDeleted(evt: WebhookEvent, c: any, requestId: string) {
	const { id } = evt.data;

	if (!id) {
		secureLogger.warn('User deleted event without user ID', { requestId });
		return c.json({ error: 'No user ID' }, 400);
	}

	// Validate clerkUserId format
	if (!id.startsWith('user_')) {
		secureLogger.warn('Invalid Clerk user ID format in delete event', { userId: id, requestId });
		return c.json({ error: 'Invalid user ID format' }, 400);
	}

	try {
		const poolDb = getPoolClient();

		// Find user's subscription
		const [sub] = await poolDb
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, id))
			.limit(1);

		// Delete Stripe customer if exists (LGPD compliance)
		if (sub?.stripeCustomerId) {
			try {
				await StripeCustomerService.deleteCustomer(sub.stripeCustomerId);
				secureLogger.info('Stripe customer deleted', {
					userId: id,
					stripeCustomerId: sub.stripeCustomerId,
					requestId,
				});
			} catch (stripeError) {
				// Log but don't fail - Stripe deletion is best effort
				secureLogger.warn('Failed to delete Stripe customer, continuing with cleanup', {
					userId: id,
					stripeCustomerId: sub.stripeCustomerId,
					requestId,
					error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
				});
			}
		}

		// Delete subscription from database (cascade will handle related data)
		if (sub) {
			await poolDb.delete(subscriptions).where(eq(subscriptions.userId, id));
			secureLogger.info('Subscription deleted', {
				userId: id,
				subscriptionId: sub.id,
				requestId
			});
		} else {
			secureLogger.info('No subscription found for deleted user', { userId: id, requestId });
		}

		secureLogger.info('User deleted and data cleaned up', { userId: id, requestId });
	} catch (deleteError) {
		secureLogger.error('Failed to delete user data', {
			userId: id,
			requestId,
			error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
			stack: deleteError instanceof Error ? deleteError.stack : undefined,
		});
		return c.json({ error: 'Failed to delete user data' }, 500);
	}
}

// Handle user updates
async function handleUserUpdated(evt: WebhookEvent, c: any, requestId: string) {
	const { id, email_addresses, first_name, last_name } = evt.data;
	const email = email_addresses[0]?.email_address;
	const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

	try {
		// Get user's subscription to find stripeCustomerId
		const poolDb = getPoolClient();
		const [sub] = await poolDb
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, id))
			.limit(1);

		if (sub?.stripeCustomerId && email) {
			// Update Stripe customer info (with idempotency)
			await StripeCustomerService.updateCustomer(
				sub.stripeCustomerId,
				{
					email,
					name,
				},
				id, // clerkUserId for idempotency
			);
		}

		secureLogger.info('User updated', { userId: id, requestId });
	} catch (updateError) {
		secureLogger.error('Failed to update user', {
			userId: id,
			email,
			requestId,
			error: updateError instanceof Error ? updateError.message : 'Unknown error',
		});
		return c.json({ error: 'Failed to update user' }, 500);
	}
}

export default clerkWebhookHandlerModern;
export {
	clerkWebhookHandlerModern,
	handleUserCreated,
	handleUserUpdated,
	handleUserDeleted,
	processWebhookEvent
};