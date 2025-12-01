import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { getPoolClient } from '@/db/client';
import { paymentHistory, subscriptions } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import { getStripeClient } from '@/lib/stripe/client';
import { getPlanByStripePrice, STRIPE_CONFIG } from '@/lib/stripe/config';

// Helper type for Stripe Invoice with all expected properties
interface InvoiceWithDetails extends Stripe.Invoice {
	payment_intent?: string | { id: string } | null;
	charge?: string | { id: string } | null;
}

export class StripeWebhookService {
	static constructEvent(payload: string | Buffer, signature: string) {
		const stripe = getStripeClient();
		if (!STRIPE_CONFIG.webhookSecret) {
			throw new Error('STRIPE_WEBHOOK_SECRET is not set');
		}
		return stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.webhookSecret);
	}

	static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
		const db = getPoolClient();
		const clerkUserId = session.metadata?.clerkUserId;
		const customerId =
			typeof session.customer === 'string' ? session.customer : session.customer?.id;
		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

		if (!(clerkUserId && customerId && subscriptionId)) {
			secureLogger.warn('Checkout session missing metadata or IDs', {
				sessionId: session.id,
			});
			return;
		}

		// Update user subscription
		const stripe = getStripeClient();
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		const priceId = subscription.items.data[0].price.id;
		const plan = getPlanByStripePrice(priceId);
		const planId = plan ? plan.id : 'free';

		// Get billing period from subscription item (Stripe v20+ change)
		const subscriptionItem = subscription.items.data[0];
		const periodStart = subscriptionItem.current_period_start;
		const periodEnd = subscriptionItem.current_period_end;

		// Map Stripe status to database-compatible status
		const stripeStatus = subscription.status;
		const status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' =
			stripeStatus === 'incomplete' ||
			stripeStatus === 'incomplete_expired' ||
			stripeStatus === 'paused'
				? 'canceled'
				: (stripeStatus as 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid');

		await db.transaction(async (tx) => {
			// Update subscription record
			await tx
				.update(subscriptions)
				.set({
					stripeCustomerId: customerId,
					stripeSubscriptionId: subscriptionId,
					planId,
					status,
					currentPeriodStart: new Date(periodStart * 1000),
					currentPeriodEnd: new Date(periodEnd * 1000),
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.userId, clerkUserId));
		});

		secureLogger.info('Checkout session completed', {
			clerkUserId,
			subscriptionId,
		});
	}

	static async handleSubscriptionCreated(_subscription: Stripe.Subscription) {
		// Handled by checkout.session.completed for initial creation
		// But could be useful for manual creations
	}

	static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
		const db = getPoolClient();
		const customerId =
			typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

		// Find subscription by customerId
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) return;

		const priceId = subscription.items.data[0].price.id;
		const plan = getPlanByStripePrice(priceId);
		const planId = plan ? plan.id : 'free';

		// Get billing period from subscription item (Stripe v20+ change)
		const subscriptionItem = subscription.items.data[0];
		const periodStart = subscriptionItem.current_period_start;
		const periodEnd = subscriptionItem.current_period_end;

		// Map Stripe status to database-compatible status
		const stripeStatus = subscription.status;
		const status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' =
			stripeStatus === 'incomplete' ||
			stripeStatus === 'incomplete_expired' ||
			stripeStatus === 'paused'
				? 'canceled'
				: (stripeStatus as 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid');

		await db
			.update(subscriptions)
			.set({
				stripeSubscriptionId: subscription.id,
				planId,
				status,
				currentPeriodStart: new Date(periodStart * 1000),
				currentPeriodEnd: new Date(periodEnd * 1000),
				cancelAtPeriodEnd: subscription.cancel_at_period_end,
				canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.id, subRecord.id));

		secureLogger.info('Subscription updated webhook processed', {
			subscriptionId: subscription.id,
		});
	}

	static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
		const db = getPoolClient();
		const customerId =
			typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

		await db
			.update(subscriptions)
			.set({
				status: 'canceled',
				canceledAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.stripeCustomerId, customerId));

		secureLogger.info('Subscription deleted webhook processed', {
			subscriptionId: subscription.id,
		});
	}

	static async handleInvoicePaid(invoice: Stripe.Invoice) {
		const db = getPoolClient();
		// Cast to access extended properties
		const inv = invoice as InvoiceWithDetails;
		const customerId =
			typeof inv.customer === 'string' ? inv.customer : (inv.customer as { id: string } | null)?.id;

		if (!customerId) return;

		// Find user
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) return;

		await db.insert(paymentHistory).values({
			userId: subRecord.userId,
			subscriptionId: subRecord.id,
			stripePaymentIntentId:
				typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent?.id,
			stripeInvoiceId: inv.id,
			stripeChargeId: typeof inv.charge === 'string' ? inv.charge : inv.charge?.id,
			amountCents: inv.amount_paid,
			currency: inv.currency,
			status: 'succeeded',
			description: inv.description || 'Assinatura AegisWallet',
			receiptUrl: inv.hosted_invoice_url,
			invoicePdf: inv.invoice_pdf,
		});

		secureLogger.info('Invoice paid webhook processed', {
			invoiceId: inv.id,
		});
	}

	static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
		const db = getPoolClient();
		// Cast to access extended properties
		const inv = invoice as InvoiceWithDetails;
		const customerId =
			typeof inv.customer === 'string' ? inv.customer : (inv.customer as { id: string } | null)?.id;

		if (!customerId) return;

		// Find user
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) return;

		await db.insert(paymentHistory).values({
			userId: subRecord.userId,
			subscriptionId: subRecord.id,
			stripePaymentIntentId:
				typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent?.id,
			stripeInvoiceId: inv.id,
			stripeChargeId: typeof inv.charge === 'string' ? inv.charge : inv.charge?.id,
			amountCents: inv.amount_due,
			currency: inv.currency,
			status: 'failed',
			description: inv.description || 'Falha no pagamento',
			failureCode: inv.last_finalization_error?.code,
			failureMessage: invoice.last_finalization_error?.message,
		});

		secureLogger.warn('Invoice payment failed webhook processed', {
			invoiceId: invoice.id,
		});
	}
}
