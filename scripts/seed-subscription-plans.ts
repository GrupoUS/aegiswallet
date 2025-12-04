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
			description: 'Gerencie suas finanças manualmente',
			priceCents: 0,
			currency: 'BRL',
			interval: null,
			stripeProductId: null,
			stripePriceId: null,
			features: [
				'Dashboard completo',
				'Adicionar transações manualmente',
				'Categorização de gastos',
				'Relatórios básicos',
				'1 conta bancária',
			],
			aiModels: [], // Sem acesso a IA
			maxBankAccounts: 1,
			maxTransactionsPerMonth: 100,
			isActive: true,
			displayOrder: 0,
		},
		{
			id: 'basic',
			name: 'Básico',
			description: 'Assistente financeiro com IA básica',
			priceCents: 1990, // R$ 19,90 (conforme Stripe)
			currency: 'BRL',
			interval: 'month',
			stripeProductId: 'prod_SMort0etshvwat',
			stripePriceId: process.env.STRIPE_PRICE_BASIC_MONTHLY || null,
			features: [
				'Tudo do plano Gratuito',
				'Chat com IA (Gemini Flash)',
				'Insights automáticos',
				'3 contas bancárias',
				'Transações ilimitadas',
				'Relatórios mensais',
			],
			aiModels: ['gemini-flash', 'gemini-flash-lite'], // Modelos de IA mais econômicos
			maxBankAccounts: 3,
			maxTransactionsPerMonth: null, // unlimited
			isActive: true,
			displayOrder: 1,
		},
		{
			id: 'advanced',
			name: 'Avançado',
			description: 'Todos os recursos premium com IAs avançadas',
			priceCents: 9900, // R$ 99,00 (conforme Stripe)
			currency: 'BRL',
			interval: 'month',
			stripeProductId: 'prod_SMort0etshvwat',
			stripePriceId: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || null,
			features: [
				'Tudo do plano Básico',
				'IAs Avançadas (Claude Sonnet, Gemini Pro)',
				'Análises preditivas',
				'Contas ilimitadas',
				'Suporte prioritário',
				'API access',
				'Automações avançadas',
			],
			aiModels: ['claude-sonnet', 'gemini-pro', 'gemini-flash', 'gemini-flash-lite', 'gpt-4o'], // Todos os modelos
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
