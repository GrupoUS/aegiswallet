import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { getHttpClient } from '@/db/client';
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
			secureLogger.error('Webhook secret not configured', {
				hasConfig: !!STRIPE_CONFIG.webhookSecret,
			});
			throw new Error(
				'STRIPE_WEBHOOK_SECRET não está configurado. Verifique as variáveis de ambiente.',
			);
		}

		try {
			const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_CONFIG.webhookSecret);
			secureLogger.info('Webhook event constructed successfully', {
				type: event.type,
				id: event.id,
			});
			return event;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			secureLogger.error('Failed to construct webhook event', {
				error: errorMessage,
				signatureLength: signature?.length,
			});
			throw new Error(`Falha ao validar webhook: ${errorMessage}`);
		}
	}

	static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
		const db = getHttpClient();
		const clerkUserId = session.metadata?.clerkUserId;
		const customerId =
			typeof session.customer === 'string' ? session.customer : session.customer?.id;
		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

		if (!(clerkUserId && customerId && subscriptionId)) {
			secureLogger.warn('Checkout session missing required metadata', {
				sessionId: session.id,
				hasClerkUserId: !!clerkUserId,
				hasCustomerId: !!customerId,
				hasSubscriptionId: !!subscriptionId,
			});
			throw new Error('Checkout session incompleto - metadados obrigatórios não encontrados');
		}

		try {
			// Check if subscription already exists to avoid duplicates
			const [existingSubscription] = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
				.limit(1);

			if (existingSubscription) {
				secureLogger.info('Checkout session already processed', {
					sessionId: session.id,
					subscriptionId,
					existingStatus: existingSubscription.status,
				});
				return;
			}

			// Get subscription details from Stripe
			const stripe = getStripeClient();
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);
			const priceId = subscription.items.data[0]?.price?.id;

			if (!priceId) {
				throw new Error('Price ID não encontrado na assinatura do Stripe');
			}

			const plan = getPlanByStripePrice(priceId);
			const planId = plan ? plan.id : 'free';

			// Get billing period from subscription item (Stripe v20+ change)
			const subscriptionItem = subscription.items.data[0];
			if (!subscriptionItem) {
				throw new Error('Item da assinatura não encontrado');
			}

			const periodStart = subscriptionItem.current_period_start;
			const periodEnd = subscriptionItem.current_period_end;

			if (!(periodStart && periodEnd)) {
				throw new Error('Datas do período de cobrança não encontradas');
			}

			// Map Stripe status to database-compatible status
			const stripeStatus = subscription.status;
			const status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' =
				stripeStatus === 'incomplete' ||
				stripeStatus === 'incomplete_expired' ||
				stripeStatus === 'paused'
					? 'canceled'
					: (stripeStatus as 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid');

			// Update or create subscription record
			await db
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

			secureLogger.info('Checkout session completed successfully', {
				clerkUserId,
				sessionId: session.id,
				subscriptionId,
				status,
				planId,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			secureLogger.error('Failed to process checkout session completion', {
				sessionId: session.id,
				clerkUserId,
				error: errorMessage,
			});
			throw error;
		}
	}

	static async handleSubscriptionCreated(_subscription: Stripe.Subscription) {
		// Handled by checkout.session.completed for initial creation
		// But could be useful for manual creations
	}

	static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
		const db = getHttpClient();
		const customerId =
			typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

		// Find subscription by customerId
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) {
			secureLogger.warn('Subscription update webhook subscription not found', {
				customerId,
				subscriptionId: subscription.id,
			});
			return;
		}

		const priceId = subscription.items.data[0]?.price?.id;
		if (!priceId) {
			secureLogger.error('No price ID found in subscription update', {
				subscriptionId: subscription.id,
			});
			return;
		}

		const plan = getPlanByStripePrice(priceId);
		const planId = plan ? plan.id : 'free';

		// Get billing period from subscription item (Stripe v20+ change)
		const subscriptionItem = subscription.items.data[0];
		if (!subscriptionItem) {
			secureLogger.error('No subscription items found in update', {
				subscriptionId: subscription.id,
			});
			return;
		}

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

		secureLogger.info('Subscription updated webhook processed successfully', {
			subscriptionId: subscription.id,
			previousStatus: subRecord.status,
			newStatus: status,
			previousPlanId: subRecord.planId,
			newPlanId: planId,
		});
	}

	static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
		const db = getHttpClient();
		const customerId =
			typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

		// Find subscription by customerId first
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) {
			secureLogger.warn('Subscription delete webhook subscription not found', {
				customerId,
				subscriptionId: subscription.id,
			});
			return;
		}

		await db
			.update(subscriptions)
			.set({
				status: 'canceled',
				canceledAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(subscriptions.stripeCustomerId, customerId));

		secureLogger.info('Subscription deleted webhook processed successfully', {
			subscriptionId: subscription.id,
			userId: subRecord.userId,
			previousStatus: subRecord.status,
		});
	}

	static async handleInvoicePaid(invoice: Stripe.Invoice) {
		const db = getHttpClient();
		// Cast to access extended properties
		const inv = invoice as InvoiceWithDetails;
		const customerId =
			typeof inv.customer === 'string' ? inv.customer : (inv.customer as { id: string } | null)?.id;

		if (!customerId) {
			secureLogger.warn('Invoice paid webhook missing customer ID', { invoiceId: inv.id });
			return;
		}

		// Find user subscription
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) {
			secureLogger.warn('Invoice paid webhook subscription not found', {
				invoiceId: inv.id,
				customerId,
			});
			return;
		}

		// Idempotency check - avoid duplicate payment records
		const [existingPayment] = await db
			.select()
			.from(paymentHistory)
			.where(eq(paymentHistory.stripeInvoiceId, inv.id))
			.limit(1);

		if (existingPayment) {
			secureLogger.info('Invoice payment already processed', {
				invoiceId: inv.id,
				existingStatus: existingPayment.status,
			});
			return;
		}

		try {
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

			secureLogger.info('Invoice paid webhook processed successfully', {
				invoiceId: inv.id,
				userId: subRecord.userId,
				amount: inv.amount_paid,
				currency: inv.currency,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			secureLogger.error('Failed to process invoice payment', {
				invoiceId: inv.id,
				userId: subRecord.userId,
				error: errorMessage,
			});
			throw error;
		}
	}

	static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
		const db = getHttpClient();
		// Cast to access extended properties
		const inv = invoice as InvoiceWithDetails;
		const customerId =
			typeof inv.customer === 'string' ? inv.customer : (inv.customer as { id: string } | null)?.id;

		if (!customerId) {
			secureLogger.warn('Invoice payment failed webhook missing customer ID', {
				invoiceId: inv.id,
			});
			return;
		}

		// Find user subscription
		const [subRecord] = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeCustomerId, customerId))
			.limit(1);

		if (!subRecord) {
			secureLogger.warn('Invoice payment failed webhook subscription not found', {
				invoiceId: inv.id,
				customerId,
			});
			return;
		}

		// Idempotency check - avoid duplicate payment failure records
		const [existingPayment] = await db
			.select()
			.from(paymentHistory)
			.where(eq(paymentHistory.stripeInvoiceId, inv.id))
			.limit(1);

		if (existingPayment) {
			secureLogger.info('Invoice payment failure already processed', {
				invoiceId: inv.id,
				existingStatus: existingPayment.status,
			});
			return;
		}

		try {
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

			secureLogger.warn('Invoice payment failed webhook processed successfully', {
				invoiceId: inv.id,
				userId: subRecord.userId,
				amount: inv.amount_due,
				currency: inv.currency,
				failureCode: inv.last_finalization_error?.code,
				failureMessage: invoice.last_finalization_error?.message,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			secureLogger.error('Failed to process invoice payment failure', {
				invoiceId: inv.id,
				userId: subRecord.userId,
				error: errorMessage,
			});
			throw error;
		}
	}
}
