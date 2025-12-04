/**
 * AI Configuration Module
 *
 * Exportações centralizadas das configurações de AI para o chat financeiro.
 *
 * @module lib/ai/config
 */

export {
	ALERT_CONFIGS,
	type AlertConfig,
	buildAnalysisPrompt,
	CONTEXT_FORMAT_TEMPLATES,
	// Constantes de configuração
	CONTEXT_LAYERS,
	default as promptConfig,
	FINANCIAL_ANALYSIS_TYPES,
	FINANCIAL_IMPROVEMENT_PROMPT,
	type FinancialAnalysisConfig,
	formatFinancialContext,
	// Funções utilitárias
	getAnalysisConfig,
	getApplicableAlerts,
	// Configuração principal
	PROMPT_CONFIG,
	// Interfaces e tipos
	type PromptConfig,
	type PromptLayerConfig,
} from './prompt-config';
