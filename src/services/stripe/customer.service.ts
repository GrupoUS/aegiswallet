import { secureLogger } from '@/lib/logging/secure-logger';
import { getStripeClient } from '@/lib/stripe/client';

interface UpdateData {
	email?: string;
	name?: string;
	metadata?: Record<string, string>;
}

export class StripeCustomerService {
	/**
	 * Generate idempotency key for Stripe operations
	 * Uses clerkUserId to ensure same key for same user
	 */
	private static getIdempotencyKey(clerkUserId: string, operation: string): string {
		return `clerk_${clerkUserId}_${operation}_${Date.now()}`;
	}

	static async createCustomer(clerkUserId: string, email: string, name?: string): Promise<string> {
		const stripe = getStripeClient();
		try {
			// Create with idempotency key
			const idempotencyKey = StripeCustomerService.getIdempotencyKey(
				clerkUserId,
				'create_customer',
			);

			const customer = await stripe.customers.create(
				{
					email,
					name,
					metadata: {
						clerkUserId,
					},
				},
				{
					idempotencyKey,
				},
			);

			secureLogger.info('Stripe customer created', {
				clerkUserId,
				stripeCustomerId: customer.id,
				idempotencyKey,
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

	static async getOrCreateCustomer(clerkUserId: string, email: string, name?: string): Promise<string> {
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

			return await StripeCustomerService.createCustomer(clerkUserId, email, name);
		} catch (error) {
			secureLogger.error('Failed to get/create Stripe customer', {
				clerkUserId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Falha ao processar cliente no Stripe');
		}
	}

	static async updateCustomer(
		stripeCustomerId: string,
		data: UpdateData,
		clerkUserId?: string,
	) {
		const stripe = getStripeClient();
		try {
			const updateOptions: { idempotencyKey?: string } = {};

			// Add idempotency key if clerkUserId is provided
			if (clerkUserId) {
				updateOptions.idempotencyKey = StripeCustomerService.getIdempotencyKey(
					clerkUserId,
					'update_customer',
				);
			}

			await stripe.customers.update(stripeCustomerId, data, updateOptions);
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
			// Check if customer exists first
			try {
				await stripe.customers.retrieve(stripeCustomerId);
			} catch (retrieveError: any) {
				// If customer doesn't exist (404), that's fine - already deleted
				if (retrieveError?.statusCode === 404) {
					secureLogger.info('Stripe customer already deleted', { stripeCustomerId });
					return;
				}
				throw retrieveError;
			}

			// Cancel active subscriptions first
			const subscriptions = await stripe.subscriptions.list({
				customer: stripeCustomerId,
				status: 'active',
			});

			for (const sub of subscriptions.data) {
				try {
					await stripe.subscriptions.cancel(sub.id);
					secureLogger.info('Stripe subscription canceled', { subscriptionId: sub.id, customerId: stripeCustomerId });
				} catch (subError) {
					// Log but continue - subscription might already be canceled
					secureLogger.warn('Failed to cancel subscription, continuing', {
						subscriptionId: sub.id,
						error: subError instanceof Error ? subError.message : 'Unknown error',
					});
				}
			}

			await stripe.customers.del(stripeCustomerId);

			secureLogger.info('Stripe customer deleted', { stripeCustomerId });
		} catch (error: any) {
			// If customer is already deleted (404), that's acceptable
			if (error?.statusCode === 404) {
				secureLogger.info('Stripe customer already deleted', { stripeCustomerId });
				return;
			}

			secureLogger.error('Failed to delete Stripe customer', {
				stripeCustomerId,
				error: error instanceof Error ? error.message : 'Unknown error',
				statusCode: error?.statusCode,
			});
			throw error;
		}
	}
}
