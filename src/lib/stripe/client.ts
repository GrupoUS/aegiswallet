/**
 * Stripe Client - Server-side Stripe SDK
 *
 * Provides type-safe Stripe client for billing operations
 * Brazilian market configuration (BRL currency)
 */

import Stripe from 'stripe';

// ========================================
// CONFIGURATION
// ========================================

/**
 * Get Stripe API key from environment
 */
function getStripeSecretKey(): string {
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) {
		throw new Error(
			'STRIPE_SECRET_KEY environment variable is not set. Configure Stripe credentials.',
		);
	}
	return key;
}

/**
 * Get Stripe Webhook signing secret
 */
export function getStripeWebhookSecret(): string {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		throw new Error(
			'STRIPE_WEBHOOK_SECRET environment variable is not set. Configure webhook signing.',
		);
	}
	return secret;
}

// ========================================
// STRIPE CLIENT
// ========================================

/**
 * Stripe SDK configuration
 */
const STRIPE_CONFIG: Stripe.StripeConfig = {
	apiVersion: '2025-04-30.basil',
	typescript: true,
	appInfo: {
		name: 'AegisWallet',
		version: '1.0.0',
		url: 'https://aegiswallet.com.br',
	},
};

/**
 * Singleton Stripe client instance
 */
let stripeClient: Stripe | null = null;

/**
 * Get or create Stripe client instance
 *
 * @returns Stripe SDK client configured for AegisWallet
 * @throws Error if STRIPE_SECRET_KEY is not set
 */
export function getStripeClient(): Stripe {
	if (!stripeClient) {
		stripeClient = new Stripe(getStripeSecretKey(), STRIPE_CONFIG);
	}
	return stripeClient;
}

/**
 * Reset the Stripe client (useful for testing)
 */
export function resetStripeClient(): void {
	stripeClient = null;
}

// ========================================
// TYPE EXPORTS
// ========================================

export type { Stripe };
export default getStripeClient;
