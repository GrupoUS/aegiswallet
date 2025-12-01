/**
 * Get Spending By Category Handler
 *
 * Retrieves spending summary grouped by category
 * Returns categories with percentages and Portuguese summary
 */

import { and, count, desc, eq, gte, lte, sum } from 'drizzle-orm';

import type { GetSpendingByCategoryInput } from '../schemas';
import { db } from '@/db/client';
import { transactionCategories, transactions } from '@/db/schema';

export interface SpendingByCategoryResult {
	categories: Array<{
		categoryId: string;
		categoryName: string;
		amount: number;
		percentage: number;
		transactionCount: number;
	}>;
	totalSpending: number;
	period: string;
	summary: string;
}

function getPeriodDates(period: 'week' | 'month' | 'quarter' | 'year'): {
	start: Date;
	end: Date;
} {
	const now = new Date();
	const end = new Date(now);
	let start: Date;

	switch (period) {
		case 'week':
			start = new Date(now);
			start.setDate(now.getDate() - 7);
			break;
		case 'month':
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
		case 'quarter': {
			const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
			start = new Date(now.getFullYear(), quarterMonth, 1);
			break;
		}
		case 'year':
			start = new Date(now.getFullYear(), 0, 1);
			break;
	}

	return { start, end };
}

export async function getSpendingByCategory(
	userId: string,
	input: GetSpendingByCategoryInput,
): Promise<SpendingByCategoryResult> {
	const { period = 'month' } = input;
	const { start, end } = getPeriodDates(period);

	// Query spending by category with transaction count
	const result = await db
		.select({
			categoryId: transactions.categoryId,
			categoryName: transactionCategories.name,
			total: sum(transactions.amount),
			transactionCount: count(transactions.id),
		})
		.from(transactions)
		.leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.transactionType, 'debit'),
				gte(transactions.transactionDate, start),
				lte(transactions.transactionDate, end),
			),
		)
		.groupBy(transactions.categoryId, transactionCategories.name)
		.orderBy(desc(sum(transactions.amount)));

	const totalSpending = result.reduce((sum, r) => sum + Math.abs(Number(r.total || 0)), 0);

	const categories = result.map((r) => ({
		categoryId: r.categoryId || 'uncategorized',
		categoryName: r.categoryName || 'Sem categoria',
		amount: Math.abs(Number(r.total || 0)),
		percentage:
			totalSpending > 0 ? Math.round((Math.abs(Number(r.total || 0)) / totalSpending) * 100) : 0,
		transactionCount: Number(r.transactionCount || 0),
	}));

	const periodNames: Record<string, string> = {
		week: 'última semana',
		month: 'mês atual',
		quarter: 'trimestre atual',
		year: 'ano atual',
	};

	const topCategory = categories[0];
	const summary =
		categories.length === 0
			? `Nenhum gasto registrado no ${periodNames[period]}.`
			: `Gasto total de R$ ${totalSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no ${periodNames[period]}. Maior categoria: ${topCategory.categoryName} (${topCategory.percentage}%).`;

	return {
		categories,
		totalSpending,
		period: periodNames[period],
		summary,
	};
}
