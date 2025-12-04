export const AI_CONSENT_TYPE = 'financial_data' as const;
export const AI_CONSENT_VERSION = '1.0';
export const AI_CONSENT_PURPOSE = 'AI financial analysis and personalized recommendations';
export const AI_CONSENT_LEGAL_BASIS = 'consent'; // LGPD Art. 7, I

/**
 * Consent information for display to users
 */
export const AI_CONSENT_INFO = {
	title: 'Assistente Financeiro Inteligente',
	description:
		'Nosso assistente de IA analisa seus dados financeiros para fornecer sugestões personalizadas de economia, controle de gastos e planejamento financeiro.',
	dataAccessed: [
		'Saldos das suas contas',
		'Histórico de transações',
		'Orçamentos e limites definidos',
		'Metas financeiras cadastradas',
		'Pagamentos futuros agendados',
	],
	userRights: [
		'Revogar este consentimento a qualquer momento',
		'Seus dados não são compartilhados com terceiros',
		'Conversas não são armazenadas permanentemente',
		'Solicitar exclusão dos seus dados a qualquer momento',
	],
	version: AI_CONSENT_VERSION,
} as const;
