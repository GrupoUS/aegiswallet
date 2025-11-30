import { and, desc, eq, gte, lte, sum } from 'drizzle-orm';

import type { GetSpendingTrendsInput } from '../schemas';
import { db } from '@/db/client';
import { transactionCategories, transactions } from '@/db/schema';

export interface SpendingTrendsResult {
	trends: Array<{
		periodLabel: string;
		periodStart: Date;
		periodEnd: Date;
		totalSpending: number;
		categoryBreakdown: Array<{
			categoryName: string;
			amount: number;
		}>;
	}>;
	averageSpending: number;
	trend: 'increasing' | 'decreasing' | 'stable';
	trendPercentage: number;
	summary: string;
}

function getPeriodRanges(
	periodType: 'month' | 'week',
	periods: number,
): Array<{ start: Date; end: Date; label: string }> {
	const ranges: Array<{ start: Date; end: Date; label: string }> = [];
	const now = new Date();

	for (let i = 0; i < periods; i++) {
		let start: Date;
		let end: Date;
		let label: string;

		if (periodType === 'month') {
			start = new Date(now.getFullYear(), now.getMonth() - i, 1);
			end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
			label = start.toLocaleDateString('pt-BR', {
				month: 'long',
				year: 'numeric',
			});
		} else {
			end = new Date(now);
			end.setDate(now.getDate() - i * 7);
			start = new Date(end);
			start.setDate(end.getDate() - 6);
			label = `Semana de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
		}

		ranges.push({ start, end, label });
	}

	return ranges.reverse(); // Oldest first
}

export async function getSpendingTrends(
	userId: string,
	input: GetSpendingTrendsInput,
): Promise<SpendingTrendsResult> {
	const { categoryId, periods = 3, periodType = 'month' } = input;
	const periodRanges = getPeriodRanges(periodType, periods);

	const trends = await Promise.all(
		periodRanges.map(async ({ start, end, label }) => {
			const conditions = [
				eq(transactions.userId, userId),
				eq(transactions.transactionType, 'debit'),
				gte(transactions.transactionDate, start),
				lte(transactions.transactionDate, end),
			];

			if (categoryId) {
				conditions.push(eq(transactions.categoryId, categoryId));
			}

			const spendingData = await db
				.select({
					categoryId: transactions.categoryId,
					categoryName: transactionCategories.name,
					total: sum(transactions.amount),
				})
				.from(transactions)
				.leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
				.where(and(...conditions))
				.groupBy(transactions.categoryId, transactionCategories.name)
				.orderBy(desc(sum(transactions.amount)));

			const totalSpending = spendingData.reduce(
				(acc, s) => acc + Math.abs(Number(s.total || 0)),
				0,
			);
			const categoryBreakdown = spendingData.slice(0, 5).map((s) => ({
				categoryName: s.categoryName || 'Sem categoria',
				amount: Math.abs(Number(s.total || 0)),
			}));

			return {
				periodLabel: label,
				periodStart: start,
				periodEnd: end,
				totalSpending,
				categoryBreakdown,
			};
		}),
	);

	const totals = trends.map((t) => t.totalSpending);
	const averageSpending = totals.reduce((a, b) => a + b, 0) / totals.length;

	// Calculate trend
	let trend: 'increasing' | 'decreasing' | 'stable';
	let trendPercentage = 0;

	if (totals.length >= 2) {
		const lastPeriod = totals[totals.length - 1];
		const previousPeriod = totals[totals.length - 2];

		if (previousPeriod > 0) {
			trendPercentage = Math.round(((lastPeriod - previousPeriod) / previousPeriod) * 100);
			if (trendPercentage > 5) {
				trend = 'increasing';
			} else if (trendPercentage < -5) {
				trend = 'decreasing';
			} else {
				trend = 'stable';
			}
		} else {
			trend = 'stable';
		}
	} else {
		trend = 'stable';
	}

	const trendEmoji = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
	const trendText =
		trend === 'increasing'
			? `aumentaram ${Math.abs(trendPercentage)}%`
			: trend === 'decreasing'
				? `diminuíram ${Math.abs(trendPercentage)}%`
				: 'permaneceram estáveis';

	const summary = `${trendEmoji} Seus gastos ${trendText} no último período. Média: R$ ${averageSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ${periodType === 'month' ? 'mês' : 'semana'}.`;

	return {
		trends,
		averageSpending,
		trend,
		trendPercentage,
		summary,
	};
}
