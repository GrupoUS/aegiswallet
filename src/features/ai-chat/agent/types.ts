/**
 * Financial Agent Types
 * Tool definitions, context types, and response formats
 */

export interface FinancialContext {
	totalBalance: number;
	availableBalance: number;
	monthlyIncome: number;
	monthlyExpenses: number;
	topCategories: CategorySummary[];
	pendingAlerts: FinancialAlert[];
	upcomingPayments: UpcomingPayment[];
	lastUpdated: Date;
}

export interface CategorySummary {
	categoryId: string;
	categoryName: string;
	amount: number;
	percentage: number;
	trend: 'up' | 'down' | 'stable';
}

export interface FinancialAlert {
	id: string;
	type: 'budget_exceeded' | 'low_balance' | 'unusual_spending' | 'payment_due';
	message: string;
	severity: 'low' | 'medium' | 'high';
	actionable: boolean;
}

export interface UpcomingPayment {
	id: string;
	description: string;
	amount: number;
	dueDate: Date;
	isRecurring: boolean;
}

export type ToolExecutionResult<T = unknown> =
	| {
			success: true;
			result: T;
	  }
	| {
			success: false;
			error: string;
	  };

export type FinancialToolName =
	| 'get_account_balances'
	| 'get_recent_transactions'
	| 'get_spending_by_category'
	| 'get_upcoming_payments'
	| 'get_budget_status'
	| 'get_financial_insights'
	| 'get_spending_trends';
