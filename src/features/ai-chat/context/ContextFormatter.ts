import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { FinancialContext, Transaction } from './ContextRetriever';

/**
 * Safely format a date, returning fallback for invalid dates
 */
function safeFormatDate(dateValue: string | Date | null | undefined, formatStr: string): string {
	if (!dateValue) return '-';

	try {
		let date: Date;
		if (typeof dateValue === 'string') {
			date = parseISO(dateValue);
			if (!isValid(date)) {
				date = new Date(dateValue);
			}
		} else {
			date = dateValue;
		}

		if (!isValid(date)) return '-';
		return format(date, formatStr, { locale: ptBR });
	} catch {
		return '-';
	}
}

/**
 * Format complete financial context for AI consumption
 */
export function formatContextForAI(context: FinancialContext): string {
	const sections: string[] = [];

	// Summary section
	sections.push(formatSummary(context));

	// Accounts section
	if (context.accountBalances.length > 0) {
		sections.push(formatAccounts(context.accountBalances));
	}

	// Transactions section
	if (context.recentTransactions.length > 0) {
		sections.push(formatTransactions(context.recentTransactions));
	}

	// Events section
	if (context.upcomingEvents.length > 0) {
		sections.push(formatEvents(context.upcomingEvents));
	}

	return sections.join('\n\n');
}

/**
 * Format for conversation history
 */
export function formatContextForHistory(context: FinancialContext): string {
	return `Contexto capturado: ${context.recentTransactions.length} transações, ${context.accountBalances.length} contas, ${context.upcomingEvents.length} eventos futuros.`;
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: currency || 'BRL',
	}).format(amount);
}

/**
 * Get friendly category name
 */
function getCategoryName(category: string): string {
	const categoryMap: Record<string, string> = {
		food: 'Alimentação',
		transport: 'Transporte',
		housing: 'Moradia',
		health: 'Saúde',
		entertainment: 'Entretenimento',
		education: 'Educação',
		shopping: 'Compras',
		utilities: 'Utilidades',
		investment: 'Investimentos',
		salary: 'Salário',
		other: 'Outros',
	};

	return categoryMap[category] || category;
}

/**
 * Format summary
 */
function formatSummary(context: FinancialContext): string {
	const { summary, userPreferences } = context;
	const currency = userPreferences.currency || 'BRL';

	return `
## Resumo Financeiro do Usuário

- Saldo Total: ${formatCurrency(summary.totalBalance, currency)}
- Receita Mensal: ${formatCurrency(summary.monthlyIncome, currency)}
- Despesas Mensais: ${formatCurrency(summary.monthlyExpenses, currency)}
- Saldo Líquido: ${formatCurrency(summary.monthlyIncome - summary.monthlyExpenses, currency)}
- Contas Pendentes: ${summary.upcomingBillsCount} conta(s)
`.trim();
}

/**
 * Format account balances
 */
function formatAccounts(
	accounts: Array<{
		accountName: string;
		balance: number;
		currency: string;
	}>,
): string {
	const accountList = accounts
		.map((acc) => `  - ${acc.accountName}: ${formatCurrency(acc.balance, acc.currency)}`)
		.join('\n');

	return `
## Contas Bancárias

${accountList}
`.trim();
}

/**
 * Format transactions
 */
function formatTransactions(transactions: Transaction[]): string {
	// Group by category
	const byCategory = transactions.reduce(
		(acc, t) => {
			if (!acc[t.category]) acc[t.category] = [];
			acc[t.category].push(t);
			return acc;
		},
		{} as Record<string, Transaction[]>,
	);

	const categoryStats = (Object.entries(byCategory) as [string, Transaction[]][])
		.map(([category, txs]) => {
			const total = txs.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
			return `  - ${getCategoryName(category)}: ${txs.length} transações, total de ${formatCurrency(total, 'BRL')}`;
		})
		.join('\n');

	// Recent 5 transactions
	const recentList = transactions
		.slice(0, 5)
		.map((t) => {
			const date = safeFormatDate(t.date, 'dd/MM');
			const type = t.type === 'income' ? '+' : '-';
			return `  - ${date}: ${type}${formatCurrency(Math.abs(t.amount), 'BRL')} - ${t.description}`;
		})
		.join('\n');

	return `
## Transações Recentes (últimos 30 dias)

### Por Categoria:
${categoryStats}

### Últimas 5 Transações:
${recentList}
`.trim();
}

/**
 * Format financial events
 */
function formatEvents(
	events: Array<{
		title: string;
		amount: number;
		date: string;
		status: string;
	}>,
): string {
	const eventList = events
		.slice(0, 10)
		.map((e) => {
			const date = safeFormatDate(e.date, 'dd/MM/yyyy');
			const status = e.status === 'pending' ? '⏳' : '✅';
			return `  - ${status} ${date}: ${e.title} - ${formatCurrency(e.amount, 'BRL')}`;
		})
		.join('\n');

	return `
## Próximas Contas e Eventos

${eventList}
`.trim();
}

// Legacy object export for backward compatibility
export const ContextFormatter = {
	formatForAI: formatContextForAI,
	formatForHistory: formatContextForHistory,
};
