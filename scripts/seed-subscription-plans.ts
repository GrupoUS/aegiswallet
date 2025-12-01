import { getHttpClient } from '@/db/client';
import { subscriptionPlans } from '@/db/schema';

/**
 * Seed subscription plans
 * Run with: bun scripts/seed-subscription-plans.ts
 */
async function seedSubscriptionPlans() {
	const db = getHttpClient();

	const plans = [
		{
			id: 'free',
			name: 'Gratuito',
			description: 'Dashboard básico e recursos limitados',
			priceCents: 0,
			currency: 'BRL',
			interval: null,
			stripeProductId: null,
			stripePriceId: null,
			features: ['Dashboard básico', '1 conta bancária', 'Transações limitadas'],
			aiModels: [],
			maxBankAccounts: 1,
			maxTransactionsPerMonth: 100,
			isActive: true,
			displayOrder: 0,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Chat IA e automações básicas',
			priceCents: 5900,
			currency: 'BRL',
			interval: 'month',
			stripeProductId: null, // Set from Stripe Dashboard
			stripePriceId: process.env.STRIPE_PRICE_BASIC_MONTHLY || null,
			features: [
				'Chat IA (Gemini Flash)',
				'3 contas bancárias',
				'Automações básicas',
				'Relatórios mensais',
			],
			aiModels: ['gemini-flash'],
			maxBankAccounts: 3,
			maxTransactionsPerMonth: null, // unlimited
			isActive: true,
			displayOrder: 1,
		},
		{
			id: 'advanced',
			name: 'Avançado',
			description: 'Todos os modelos de IA e recursos premium',
			priceCents: 11900,
			currency: 'BRL',
			interval: 'month',
			stripeProductId: null, // Set from Stripe Dashboard
			stripePriceId: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || null,
			features: [
				'Todas as IAs (GPT-4, Claude, Gemini Pro)',
				'Contas ilimitadas',
				'API access',
				'Suporte prioritário',
				'Automações avançadas',
			],
			aiModels: ['gpt-4o', 'claude-sonnet', 'gemini-pro', 'gemini-flash'],
			maxBankAccounts: null, // unlimited
			maxTransactionsPerMonth: null, // unlimited
			isActive: true,
			displayOrder: 2,
		},
	];

	console.log('🌱 Seeding subscription plans...');

	for (const plan of plans) {
		try {
			// Use insert ... on conflict to handle idempotency
			await db
				.insert(subscriptionPlans)
				.values(plan)
				.onConflictDoUpdate({
					target: subscriptionPlans.id,
					set: {
						name: plan.name,
						description: plan.description,
						priceCents: plan.priceCents,
						currency: plan.currency,
						interval: plan.interval,
						stripePriceId: plan.stripePriceId,
						features: plan.features,
						aiModels: plan.aiModels,
						maxBankAccounts: plan.maxBankAccounts,
						maxTransactionsPerMonth: plan.maxTransactionsPerMonth,
						isActive: plan.isActive,
						displayOrder: plan.displayOrder,
						updatedAt: new Date(),
					},
				});

			console.log(`✅ Seeded plan: ${plan.name}`);
		} catch (error) {
			console.error(`❌ Failed to seed plan ${plan.id}:`, error);
		}
	}

	console.log('✅ Subscription plans seeded successfully!');
}

seedSubscriptionPlans()
	.then(() => {
		console.log('Done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	});
