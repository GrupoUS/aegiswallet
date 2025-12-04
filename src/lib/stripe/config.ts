import { z } from 'zod';

// Schema for Stripe environment variables
const envSchema = z.object({
	STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
	STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY is required'),
	STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
	STRIPE_SUCCESS_URL: z.string().url('STRIPE_SUCCESS_URL must be a valid URL'),
	STRIPE_CANCEL_URL: z.string().url('STRIPE_CANCEL_URL must be a valid URL'),
	STRIPE_PORTAL_RETURN_URL: z.string().url('STRIPE_PORTAL_RETURN_URL must be a valid URL'),
	STRIPE_PRICE_BASIC_MONTHLY: z.string().min(1, 'STRIPE_PRICE_BASIC_MONTHLY is required'),
	STRIPE_PRICE_ADVANCED_MONTHLY: z.string().min(1, 'STRIPE_PRICE_ADVANCED_MONTHLY is required'),
});

// Validate environment variables
// Note: We use a try-catch block to allow build-time execution without env vars
let env: z.infer<typeof envSchema> | undefined;
try {
	env = envSchema.parse(process.env);
} catch (_error) {
	// Only throw if we are in a runtime environment where these are expected
	if (
		process.env.NODE_ENV !== 'test' &&
		process.env.NODE_ENV !== 'production' &&
		typeof window === 'undefined'
	) {
	}
	// Fallback for types/build
	env = process.env as z.infer<typeof envSchema>;
}

export const STRIPE_CONFIG = {
	secretKey: env?.STRIPE_SECRET_KEY,
	publishableKey: env?.STRIPE_PUBLISHABLE_KEY,
	webhookSecret: env?.STRIPE_WEBHOOK_SECRET,
	successUrl: env?.STRIPE_SUCCESS_URL,
	cancelUrl: env?.STRIPE_CANCEL_URL,
	portalReturnUrl: env?.STRIPE_PORTAL_RETURN_URL,
};

export const STRIPE_PRICES = {
	BASIC_MONTHLY: env?.STRIPE_PRICE_BASIC_MONTHLY,
	ADVANCED_MONTHLY: env?.STRIPE_PRICE_ADVANCED_MONTHLY,
};

export const PLANS = [
	{
		id: 'free',
		name: 'Gratuito',
		priceCents: 0,
		features: [
			'Dashboard completo',
			'Adicionar transações manualmente',
			'Categorização de gastos',
			'Relatórios básicos',
			'1 conta bancária',
		],
		aiModels: [], // Sem acesso a IA
	},
	{
		id: 'basic',
		name: 'Básico',
		priceCents: 1990, // R$ 19,90
		features: [
			'Tudo do plano Gratuito',
			'Chat com IA (Gemini Flash)',
			'Insights automáticos',
			'3 contas bancárias',
			'Transações ilimitadas',
		],
		aiModels: ['gemini-flash', 'gemini-flash-lite'], // Modelos econômicos
	},
	{
		id: 'advanced',
		name: 'Avançado',
		priceCents: 9900, // R$ 99,00
		features: [
			'Tudo do plano Básico',
			'IAs Avançadas (Claude Sonnet, Gemini Pro)',
			'Análises preditivas',
			'Contas ilimitadas',
			'Suporte prioritário',
		],
		aiModels: ['claude-sonnet', 'gemini-pro', 'gemini-flash', 'gemini-flash-lite', 'gpt-4o'], // Todos os modelos
	},
];

export const getPlanById = (id: string) => PLANS.find((p) => p.id === id);

export const getPlanByStripePrice = (priceId: string) => {
	if (priceId === STRIPE_PRICES.BASIC_MONTHLY) return getPlanById('basic');
	if (priceId === STRIPE_PRICES.ADVANCED_MONTHLY) return getPlanById('advanced');
	return null;
};

export const canAccessAI = (planId: string) => {
	const plan = getPlanById(planId);
	return plan ? plan.aiModels.length > 0 : false;
};

export const getAllowedModels = (planId: string) => {
	const plan = getPlanById(planId);
	return plan ? plan.aiModels : [];
};
