/**
 * Financial Tool Handlers
 * Individual implementations for each financial tool
 */

/**
 * Base handler interface for financial tools
 */
export interface ToolHandler<TArgs = unknown, TResult = unknown> {
	name: string;
	execute: (args: TArgs, userId: string) => Promise<TResult>;
}

// Implemented handlers
export {
	type AccountBalanceResult,
	getAccountBalances,
} from './getAccountBalances';
export { type BudgetStatusResult, getBudgetStatus } from './getBudgetStatus';
export {
	type FinancialInsightsResult,
	getFinancialInsights,
} from './getFinancialInsights';
export {
	getRecentTransactions,
	type TransactionResult,
} from './getRecentTransactions';
export {
	getSpendingByCategory,
	type SpendingByCategoryResult,
} from './getSpendingByCategory';
export {
	getSpendingTrends,
	type SpendingTrendsResult,
} from './getSpendingTrends';
export {
	getUpcomingPayments,
	type UpcomingPaymentsResult,
} from './getUpcomingPayments';
