/**
 * AI Context Module
 *
 * Exports for AI financial context injection
 */

export {
	type BudgetStatus,
	type CategorySpending,
	type FinancialContext,
	type FinancialSummary,
	formatContextForPrompt,
	type GoalProgress,
	getAIFinancialContext,
	getMinimalContext,
	type RecentTransaction,
} from './ai-context.service';
export {
	detectSpendingAnomalies,
	type FinancialAlert,
	generateFinancialAlerts,
} from './financial-alerts';
