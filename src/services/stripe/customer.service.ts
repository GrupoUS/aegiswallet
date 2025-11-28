import { secureLogger } from '@/lib/logging/secure-logger';
import { getStripeClient } from '@/lib/stripe/client';

interface UpdateData {
	email?: string;
	name?: string;
	metadata?: Record<string, string>;
}

export class StripeCustomerService {
	static async createCustomer(
		clerkUserId: string,
		email: string,
		name?: string,
	) {
		const stripe = getStripeClient();
		try {
			const customer = await stripe.customers.create({
				email,
				name,
				metadata: {
					clerkUserId,
				},
			});

			secureLogger.info('Stripe customer created', {
				clerkUserId,
				stripeCustomerId: customer.id,
			});

			return customer.id;
		} catch (error) {
			secureLogger.error('Failed to create Stripe customer', {
				clerkUserId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Falha ao criar cliente no Stripe');
		}
	}

	static async getOrCreateCustomer(
		clerkUserId: string,
		email: string,
		name?: string,
	) {
		const stripe = getStripeClient();
		try {
			// Search by metadata
			const existing = await stripe.customers.search({
				query: `metadata['clerkUserId']:'${clerkUserId}'`,
				limit: 1,
			});

			if (existing.data.length > 0) {
				return existing.data[0].id;
			}

			// If not found by metadata, try by email as fallback
			const existingByEmail = await stripe.customers.list({
				email,
				limit: 1,
			});

			if (existingByEmail.data.length > 0) {
				// Update metadata
				await stripe.customers.update(existingByEmail.data[0].id, {
					metadata: { clerkUserId },
				});
				return existingByEmail.data[0].id;
			}

			return await StripeCustomerService.createCustomer(
				clerkUserId,
				email,
				name,
			);
		} catch (error) {
			secureLogger.error('Failed to get/create Stripe customer', {
				clerkUserId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Falha ao processar cliente no Stripe');
		}
	}

	static async updateCustomer(stripeCustomerId: string, data: UpdateData) {
		const stripe = getStripeClient();
		try {
			await stripe.customers.update(stripeCustomerId, data);
		} catch (error) {
			secureLogger.error('Failed to update Stripe customer', {
				stripeCustomerId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	static async deleteCustomer(stripeCustomerId: string) {
		const stripe = getStripeClient();
		try {
			// Cancel active subscriptions first
			const subscriptions = await stripe.subscriptions.list({
				customer: stripeCustomerId,
				status: 'active',
			});

			for (const sub of subscriptions.data) {
				await stripe.subscriptions.cancel(sub.id);
			}

			await stripe.customers.del(stripeCustomerId);

			secureLogger.info('Stripe customer deleted', { stripeCustomerId });
		} catch (error) {
			secureLogger.error('Failed to delete Stripe customer', {
				stripeCustomerId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
