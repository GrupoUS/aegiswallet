import { Hono } from 'hono';

import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { StripeWebhookService } from '@/services/stripe/webhook.service';

const webhookRouter = new Hono<AppEnv>();

webhookRouter.post('/', async (c) => {
	const signature = c.req.header('stripe-signature');
	const body = await c.req.text(); // Get raw body as text

	if (!signature) {
		return c.json({ error: 'Missing stripe-signature header' }, 400);
	}

	try {
		const event = StripeWebhookService.constructEvent(body, signature);

		secureLogger.info('Stripe webhook received', {
			type: event.type,
			id: event.id,
		});

		switch (event.type) {
			case 'checkout.session.completed':
				await StripeWebhookService.handleCheckoutSessionCompleted(
					event.data.object as any,
				);
				break;
			case 'customer.subscription.created':
				await StripeWebhookService.handleSubscriptionCreated(
					event.data.object as any,
				);
				break;
			case 'customer.subscription.updated':
				await StripeWebhookService.handleSubscriptionUpdated(
					event.data.object as any,
				);
				break;
			case 'customer.subscription.deleted':
				await StripeWebhookService.handleSubscriptionDeleted(
					event.data.object as any,
				);
				break;
			case 'invoice.paid':
				await StripeWebhookService.handleInvoicePaid(event.data.object as any);
				break;
			case 'invoice.payment_failed':
				await StripeWebhookService.handleInvoicePaymentFailed(
					event.data.object as any,
				);
				break;
			default:
				secureLogger.info('Unhandled webhook event type', { type: event.type });
		}

		return c.json({ received: true });
	} catch (error) {
		secureLogger.error('Webhook processing failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		return c.json({ error: 'Webhook handler failed' }, 400);
	}
});

export default webhookRouter;
