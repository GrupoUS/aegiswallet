import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { StripeCustomerService } from './customer.service';
import { getHttpClient } from '@/db/client';
import { subscriptionPlans, subscriptions, users } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import { getStripeClient } from '@/lib/stripe/client';
import { getPlanByStripePrice, STRIPE_CONFIG } from '@/lib/stripe/config';

export class StripeSubscriptionService {
	static async createCheckoutSession(
		userId: string,
		priceId: string,
		successUrl?: string,
		cancelUrl?: string,
		requestOrigin?: string,
	) {
		const stripe = getStripeClient();
		const db = getHttpClient();

		try {
			// Fetch user to get email
			const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
			if (!user?.email) {
				throw new Error('Usuário não encontrado ou sem email');
			}

			// Get or create customer
			const customerId = await StripeCustomerService.getOrCreateCustomer(
				userId,
				user.email,
				user.fullName || undefined,
			);

			// Generate dynamic URLs based on request origin if not provided
			const baseUrl = requestOrigin || STRIPE_CONFIG.successUrl?.replace(/\/billing\/success$/, '') || 'https://app.aegiswallet.com.br';
			const finalSuccessUrl = successUrl || `${baseUrl}/billing/success`;
			const finalCancelUrl = cancelUrl || `${baseUrl}/billing/cancel`;

			// Create session
			const session = await stripe.checkout.sessions.create({
				customer: customerId,
				mode: 'subscription',
				payment_method_types: ['card'],
				line_items: [
					{
						price: priceId,
						quantity: 1,
					},
				],
				success_url: finalSuccessUrl,
				cancel_url: finalCancelUrl,
				metadata: {
					clerkUserId: userId,
				},
				allow_promotion_codes: true,
			});

			if (!session.url) {
				throw new Error('Stripe não retornou URL de checkout válida');
			}

			return {
				sessionId: session.id,
				checkoutUrl: session.url,
			};
		} catch (error) {
			secureLogger.error('Failed to create checkout session', {
				userId,
				priceId,
				requestOrigin,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	static async createPortalSession(stripeCustomerId: string, returnUrl?: string) {
		const stripe = getStripeClient();
		try {
			const session = await stripe.billingPortal.sessions.create({
				customer: stripeCustomerId,
				return_url:
					returnUrl ||
					STRIPE_CONFIG.portalReturnUrl ||
					'https://app.aegiswallet.com.br/settings/billing',
			});

			return { portalUrl: session.url };
		} catch (error) {
			secureLogger.error('Failed to create portal session', {
				stripeCustomerId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	static async getSubscription(userId: string) {
		const db = getHttpClient();
		try {
			const result = await db
				.select({
					subscription: subscriptions,
					plan: subscriptionPlans,
				})
				.from(subscriptions)
				.leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
				.where(eq(subscriptions.userId, userId))
				.limit(1);

			if (result.length === 0) {
				secureLogger.info('No subscription found for user', { userId });
				return null;
			}

			const { subscription, plan } = result[0];
			
			// Enhanced validation for subscription data
			if (!subscription) {
				secureLogger.warn('Subscription record is null despite query success', { userId });
				return null;
			}

			// Log subscription status for debugging
			secureLogger.info('Retrieved subscription for user', {
				userId,
				subscriptionId: subscription.id,
				status: subscription.status,
				planId: subscription.planId,
			});

			return {
				subscription,
				plan: plan || null, // Plan might be null if it was deleted
			};
		} catch (error) {
			secureLogger.error('Failed to get subscription', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	static async syncSubscriptionFromStripe(stripeSubscriptionId: string) {
		const stripe = getStripeClient();
		const db = getHttpClient(); // Use HTTP client for better performance in read/update operations

		try {
			const subscriptionResponse = await stripe.subscriptions.retrieve(stripeSubscriptionId);
			// Cast to Stripe.Subscription to access properties correctly
			const subscription = subscriptionResponse as unknown as Stripe.Subscription;
			const customerId =
				typeof subscription.customer === 'string'
					? subscription.customer
					: subscription.customer.id;

			// Find user by stripeCustomerId
			const [subRecord] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.stripeCustomerId, customerId))
				.limit(1);

			if (!subRecord) {
				secureLogger.warn('Subscription sync skipped: User not found for customer', { 
					customerId,
					stripeSubscriptionId 
				});
				return null;
			}

			// Determine plan
			const priceId = subscription.items.data[0]?.price?.id;
			if (!priceId) {
				secureLogger.error('No price ID found in subscription', { 
					stripeSubscriptionId,
					items: subscription.items.data.length 
				});
				throw new Error('Preço não encontrado na assinatura do Stripe');
			}

			const plan = getPlanByStripePrice(priceId);
			const planId = plan ? plan.id : 'free';

			// Map Stripe status to database-compatible status
			const stripeStatus = subscription.status;
			const status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' =
				stripeStatus === 'incomplete' ||
				stripeStatus === 'incomplete_expired' ||
				stripeStatus === 'paused'
					? 'canceled'
					: (stripeStatus as 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid');

			// Get billing period from subscription item (Stripe v20+ change)
			const subscriptionItem = subscription.items.data[0];
			if (!subscriptionItem) {
				secureLogger.error('No subscription items found', { stripeSubscriptionId });
				throw new Error('Item da assinatura não encontrado');
			}

			const periodStart = subscriptionItem.current_period_start;
			const periodEnd = subscriptionItem.current_period_end;

			if (!periodStart || !periodEnd) {
				secureLogger.error('Missing billing period dates', { 
					stripeSubscriptionId,
					periodStart,
					periodEnd 
				});
				throw new Error('Datas do período de cobrança não encontradas');
			}

			// Check if subscription already exists with same data (optimistic update)
			const existingData = {
				stripeSubscriptionId: subscription.id,
				planId,
				status,
				currentPeriodStart: new Date(periodStart * 1000),
				currentPeriodEnd: new Date(periodEnd * 1000),
			};

			const [updated] = await db
				.update(subscriptions)
				.set({
					...existingData,
					cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
					canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
					trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
					trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.id, subRecord.id))
				.returning();

			secureLogger.info('Subscription synced from Stripe', {
				userId: subRecord.userId,
				subscriptionId: subscription.id,
				status,
				planId,
				previousStatus: subRecord.status,
				previousPlanId: subRecord.planId,
			});

			return updated;
		} catch (error) {
			secureLogger.error('Failed to sync subscription', {
				stripeSubscriptionId,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	}

	static async cancelSubscription(userId: string, immediate = false) {
		const stripe = getStripeClient();
		const db = getHttpClient();

		try {
			const [sub] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, userId))
				.limit(1);

			if (!sub?.stripeSubscriptionId) {
				throw new Error('Assinatura não encontrada');
			}

			if (immediate) {
				await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
			} else {
				await stripe.subscriptions.update(sub.stripeSubscriptionId, {
					cancel_at_period_end: true,
				});
			}

			// DB update will happen via webhook, but we can optimistically update
			// Actually better to wait for webhook or just return success

			return true;
		} catch (error) {
			secureLogger.error('Failed to cancel subscription', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
