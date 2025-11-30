/**
 * Tool Executor
 * Central execution engine for all financial tools with validation and error handling
 */

import {
	getAccountBalances,
	getBudgetStatus,
	getFinancialInsights,
	getRecentTransactions,
	getSpendingByCategory,
	getSpendingTrends,
	getUpcomingPayments,
} from './handlers';
import * as schemas from './schemas';
import { logger } from '@/lib/logging';

export type ToolName =
	| 'get_account_balances'
	| 'get_recent_transactions'
	| 'get_spending_by_category'
	| 'get_upcoming_payments'
	| 'get_budget_status'
	| 'get_financial_insights'
	| 'get_spending_trends';

type ToolHandler = (userId: string, input: unknown) => Promise<unknown>;

const toolHandlers: Record<ToolName, ToolHandler> = {
	get_account_balances: async (userId, input) => {
		const validated = schemas.GetAccountBalancesSchema.parse(input);
		return getAccountBalances(userId, validated);
	},
	get_recent_transactions: async (userId, input) => {
		const validated = schemas.GetTransactionsSchema.parse(input);
		return getRecentTransactions(userId, validated);
	},
	get_spending_by_category: async (userId, input) => {
		const validated = schemas.GetSpendingByCategorySchema.parse(input);
		return getSpendingByCategory(userId, validated);
	},
	get_upcoming_payments: async (userId, input) => {
		const validated = schemas.GetUpcomingPaymentsSchema.parse(input);
		return getUpcomingPayments(userId, validated);
	},
	get_budget_status: async (userId, input) => {
		const validated = schemas.GetBudgetStatusSchema.parse(input);
		return getBudgetStatus(userId, validated);
	},
	get_financial_insights: async (userId, input) => {
		const validated = schemas.GetFinancialInsightsSchema.parse(input);
		return getFinancialInsights(userId, validated);
	},
	get_spending_trends: async (userId, input) => {
		const validated = schemas.GetSpendingTrendsSchema.parse(input);
		return getSpendingTrends(userId, validated);
	},
};

export type ToolExecutionSuccess = { success: true; result: unknown };
export type ToolExecutionFailure = { success: false; error: string };
export type ToolExecutionResult = ToolExecutionSuccess | ToolExecutionFailure;

/**
 * Execute a financial tool by name
 */
export async function executeTool(
	toolName: string,
	userId: string,
	args: Record<string, unknown>,
): Promise<ToolExecutionResult> {
	const handler = toolHandlers[toolName as ToolName];

	if (!handler) {
		return { success: false, error: `Unknown tool: ${toolName}` };
	}

	try {
		const result = await handler(userId, args);
		return { success: true, result };
	} catch (error) {
		logger.error(`Tool execution error (${toolName})`, {
			toolName,
			error: error instanceof Error ? error.message : String(error),
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Tool execution failed',
		};
	}
}

/**
 * Check if a tool name is valid
 */
export function isValidToolName(name: string): name is ToolName {
	return name in toolHandlers;
}

/**
 * Get list of available tool names
 */
export function getAvailableTools(): ToolName[] {
	return Object.keys(toolHandlers) as ToolName[];
}
