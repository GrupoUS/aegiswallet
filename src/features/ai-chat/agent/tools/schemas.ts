import { z } from 'zod';

// =============================================================================
// TOOL INPUT SCHEMAS (Zod validation)
// Financial tools for AegisWallet AI Chat Agent
// =============================================================================

/**
 * Schema for get_account_balances tool
 * Retrieves current balances from all user bank accounts
 */
export const GetAccountBalancesSchema = z.object({
	includeInactive: z.boolean().optional().default(false),
});

/**
 * Schema for get_recent_transactions tool
 * Retrieves recent transactions with optional filters
 */
export const GetTransactionsSchema = z.object({
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	categoryId: z.string().uuid().optional(),
	type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']).optional(),
	limit: z.number().min(1).max(100).optional().default(20),
});

/**
 * Schema for get_spending_by_category tool
 * Retrieves spending summary grouped by category
 */
export const GetSpendingByCategorySchema = z.object({
	period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
	compareWithPrevious: z.boolean().optional().default(false),
});

/**
 * Schema for get_upcoming_payments tool
 * Retrieves scheduled future payments
 */
export const GetUpcomingPaymentsSchema = z.object({
	daysAhead: z.number().min(1).max(90).optional().default(30),
});

/**
 * Schema for get_budget_status tool
 * Retrieves budget status by category
 */
export const GetBudgetStatusSchema = z.object({
	categoryId: z.string().uuid().optional(),
});

/**
 * Schema for get_financial_insights tool
 * Retrieves AI-generated financial insights and recommendations
 */
export const GetFinancialInsightsSchema = z.object({
	type: z
		.enum(['spending_pattern', 'budget_alert', 'opportunity', 'warning'])
		.optional(),
	onlyUnread: z.boolean().optional().default(true),
	limit: z.number().min(1).max(20).optional().default(5),
});

/**
 * Schema for get_spending_trends tool
 * Analyzes spending trends over multiple periods
 */
export const GetSpendingTrendsSchema = z.object({
	categoryId: z.string().uuid().optional(),
	periods: z.number().min(2).max(12).optional().default(3),
	periodType: z.enum(['month', 'week']).optional().default('month'),
});

// =============================================================================
// TYPE EXPORTS FOR HANDLERS
// =============================================================================

export type GetAccountBalancesInput = z.infer<typeof GetAccountBalancesSchema>;
export type GetTransactionsInput = z.infer<typeof GetTransactionsSchema>;
export type GetSpendingByCategoryInput = z.infer<
	typeof GetSpendingByCategorySchema
>;
export type GetUpcomingPaymentsInput = z.infer<
	typeof GetUpcomingPaymentsSchema
>;
export type GetBudgetStatusInput = z.infer<typeof GetBudgetStatusSchema>;
export type GetFinancialInsightsInput = z.infer<
	typeof GetFinancialInsightsSchema
>;
export type GetSpendingTrendsInput = z.infer<typeof GetSpendingTrendsSchema>;
