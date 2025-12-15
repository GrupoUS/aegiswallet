import { createClerkClient, type WebhookEvent } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { Webhook } from 'svix';

import { getPoolClient } from '@/db/client';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/users';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { OrganizationService } from '@/services/organization.service';
import { StripeCustomerService } from '@/services/stripe/customer.service';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

// In development, warn about missing env vars but don't fail
const isProduction = process.env.NODE_ENV === 'production';

if (!webhookSecret) {
        if (isProduction) {
                secureLogger.error('CLERK_WEBHOOK_SECRET environment variable is not set');
                throw new Error('CLERK_WEBHOOK_SECRET environment variable is not set');
        }
        secureLogger.warn('CLERK_WEBHOOK_SECRET not set - webhooks will not work');
}

if (!clerkSecretKey) {
        if (isProduction) {
                secureLogger.error('CLERK_SECRET_KEY environment variable is not set');
                throw new Error('CLERK_SECRET_KEY environment variable is not set');
        }
        secureLogger.warn('CLERK_SECRET_KEY not set - Clerk client will not be initialized');
}

const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

const clerkWebhookHandler = new Hono<AppEnv>();

// biome-ignore lint: Webhook handler needs to process multiple event types
clerkWebhookHandler.post('/', async (c) => {
        const requestId = c.get('requestId') || crypto.randomUUID();

        try {
                const payload = await c.req.text();
                const headers = {
                        'svix-id': c.req.header('svix-id') || '',
                        'svix-timestamp': c.req.header('svix-timestamp') || '',
                        'svix-signature': c.req.header('svix-signature') || '',
                };

                secureLogger.info('Clerk webhook received', {
                        requestId,
                        hasPayload: !!payload,
                        payloadLength: payload.length,
                        hasHeaders: {
                                'svix-id': !!headers['svix-id'],
                                'svix-timestamp': !!headers['svix-timestamp'],
                                'svix-signature': !!headers['svix-signature'],
                        },
                });

                // Validate required headers
                if (!(headers['svix-id'] && headers['svix-timestamp'] && headers['svix-signature'])) {
                        secureLogger.warn('Missing required webhook headers', {
                                requestId,
                                headers: Object.keys(headers),
                                receivedHeaders: Object.keys(c.req.header()),
                        });
                        return c.json({ error: 'Missing required webhook headers' }, 400);
                }

                let event: WebhookEvent;

                try {
                        if (!webhookSecret) {
                                secureLogger.warn('Webhook secret not configured', { requestId });
                                return c.json({ error: 'Webhook not configured' }, 503);
                        }
                        const wh = new Webhook(webhookSecret);
                        event = wh.verify(payload, headers) as WebhookEvent;

                        secureLogger.info('Clerk webhook verified', {
                                requestId,
                                eventType: event.type,
                                eventId: event.data?.id,
                        });
                } catch (error) {
                        secureLogger.error('Clerk webhook verification failed', {
                                requestId,
                                error: error instanceof Error ? error.message : 'Unknown error',
                                errorStack: error instanceof Error ? error.stack : undefined,
                                headers: Object.keys(headers),
                        });
                        return c.json({ error: 'Invalid signature' }, 400);
                }

                const eventType = event.type;

                secureLogger.info('Processing webhook event', {
                        requestId,
                        eventType,
                        userId: event.data?.id,
                });

                try {
                        if (eventType === 'user.created') {
                                const { id, email_addresses, first_name, last_name } = event.data;
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
                                if (!id?.startsWith('user_')) {
                                        secureLogger.warn('Invalid Clerk user ID format', { userId: id, requestId });
                                        return c.json({ error: 'Invalid user ID format' }, 400);
                                }

                                // Check if user already exists (idempotency check)
                                const poolDb = getPoolClient();
                                const [existingUser] = await poolDb.select().from(users).where(eq(users.id, id)).limit(1);

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

                                        // Update Clerk user metadata with stripeCustomerId (outside transaction)
                                        if (clerkClient) {
                                                try {
                                                        await clerkClient.users.updateUserMetadata(id, {
                                                                privateMetadata: {
                                                                        stripeCustomerId,
                                                                },
                                                        });
                                                } catch (metadataError) {
                                                        // Log but don't fail - metadata update is not critical
                                                        secureLogger.warn('Failed to update Clerk metadata', {
                                                                userId: id,
                                                                requestId,
                                                                error: metadataError instanceof Error ? metadataError.message : 'Unknown error',
                                                        });
                                                }
                                        }
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
                        } else if (eventType === 'user.deleted') {
                                const { id } = event.data;

                                if (!id) {
                                        secureLogger.warn('User deleted event without user ID', { requestId });
                                        return c.json({ error: 'No user ID' }, 400);
                                }

                                // Validate clerkUserId format
                                if (!id.startsWith('user_')) {
                                        secureLogger.warn('Invalid Clerk user ID format in delete event', {
                                                userId: id,
                                                requestId,
                                        });
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
                                        // Use pool client for transaction support if needed
                                        if (sub) {
                                                await poolDb.delete(subscriptions).where(eq(subscriptions.userId, id));
                                                secureLogger.info('Subscription deleted', {
                                                        userId: id,
                                                        subscriptionId: sub.id,
                                                        requestId,
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
                        } else if (eventType === 'user.updated') {
                                const { id, email_addresses, first_name, last_name } = event.data;
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
                        } else {
                                secureLogger.info('Unhandled webhook event type', { eventType, requestId });
                        }

                        return c.json({ received: true });
                } catch (error) {
                        secureLogger.error('Clerk webhook processing error', {
                                requestId,
                                eventType,
                                error: error instanceof Error ? error.message : 'Unknown error',
                                stack: error instanceof Error ? error.stack : undefined,
                        });
                        return c.json({ error: 'Webhook processing failed' }, 500);
                }
        } catch (error) {
                secureLogger.error('Clerk webhook handler error', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        stack: error instanceof Error ? error.stack : undefined,
                });
                return c.json({ error: 'Webhook handler failed' }, 500);
        }
});

export default clerkWebhookHandler;
