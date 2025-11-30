/**
 * Financial Agent - Main exports
 * AI-powered financial assistant for AegisWallet
 */

// Context
export { FinancialContextService } from './context';
// Backend
export {
	FinancialAgentBackend,
	type FinancialAgentConfig,
} from './FinancialAgentBackend';
// Factory
export { createFinancialAgent, createFinancialAgentFromEnv } from './factory';
// Prompts
export {
	buildAlertsBlock,
	buildFinancialContextBlock,
	buildUpcomingPaymentsBlock,
	FINANCIAL_AGENT_NO_DATA_PROMPT,
	FINANCIAL_AGENT_SYSTEM_PROMPT,
} from './prompts';
// Tools
export {
	executeTool,
	financialToolDefinitions,
	type GetAccountBalancesInput,
	GetAccountBalancesSchema,
	type GetBudgetStatusInput,
	GetBudgetStatusSchema,
	type GetFinancialInsightsInput,
	GetFinancialInsightsSchema,
	type GetSpendingByCategoryInput,
	GetSpendingByCategorySchema,
	type GetSpendingTrendsInput,
	GetSpendingTrendsSchema,
	type GetTransactionsInput,
	GetTransactionsSchema,
	type GetUpcomingPaymentsInput,
	GetUpcomingPaymentsSchema,
	getAvailableTools,
	isValidToolName,
	type ToolExecutionResult,
	type ToolName,
} from './tools';
// Types
export * from './types';
