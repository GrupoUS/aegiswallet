import { and, eq, gte, lte, sum } from 'drizzle-orm';

import { db } from '@/db';

import type { GetBudgetStatusInput } from '../schemas';
import {
	budgetCategories,
	transactionCategories,
	transactions,
} from '@/db/schema';

export interface BudgetStatusResult {
	budgets: Array<{
		categoryId: string;
		categoryName: string;
		budgetAmount: number;
		spentAmount: number;
		remainingAmount: number;
		percentageUsed: number;
		status: 'ok' | 'warning' | 'exceeded';
	}>;
	overallStatus: string;
	summary: string;
}

export async function getBudgetStatus(
	userId: string,
	input: GetBudgetStatusInput,
): Promise<BudgetStatusResult> {
	const { categoryId } = input;

	// Get active budgets
	const budgetConditions = [
		eq(budgetCategories.userId, userId),
		eq(budgetCategories.isActive, true),
	];

	if (categoryId) {
		budgetConditions.push(eq(budgetCategories.categoryId, categoryId));
	}

	const budgetsData = await db
		.select({
			id: budgetCategories.id,
			categoryId: budgetCategories.categoryId,
			categoryName: transactionCategories.name,
			budgetAmount: budgetCategories.budgetAmount,
			alertThreshold: budgetCategories.alertThreshold,
			periodType: budgetCategories.periodType,
		})
		.from(budgetCategories)
		.leftJoin(
			transactionCategories,
			eq(budgetCategories.categoryId, transactionCategories.id),
		)
		.where(and(...budgetConditions));

	// Get current month spending per category
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const spendingData = await db
		.select({
			categoryId: transactions.categoryId,
			total: sum(transactions.amount),
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				eq(transactions.transactionType, 'debit'),
				gte(transactions.transactionDate, startOfMonth),
				lte(transactions.transactionDate, endOfMonth),
			),
		)
		.groupBy(transactions.categoryId);

	const spendingMap = new Map(
		spendingData.map((s) => [s.categoryId, Math.abs(Number(s.total || 0))]),
	);

	const budgets = budgetsData.map((b) => {
		const budgetAmount = Number(b.budgetAmount);
		const spentAmount = spendingMap.get(b.categoryId) || 0;
		const remainingAmount = Math.max(0, budgetAmount - spentAmount);
		const percentageUsed =
			budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
		const threshold = Number(b.alertThreshold || 80);

		let status: 'ok' | 'warning' | 'exceeded';
		if (percentageUsed >= 100) {
			status = 'exceeded';
		} else if (percentageUsed >= threshold) {
			status = 'warning';
		} else {
			status = 'ok';
		}

		return {
			categoryId: b.categoryId || 'unknown',
			categoryName: b.categoryName || 'Sem categoria',
			budgetAmount,
			spentAmount,
			remainingAmount,
			percentageUsed,
			status,
		};
	});

	const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
	const warningCount = budgets.filter((b) => b.status === 'warning').length;

	let overallStatus: string;
	if (exceededCount > 0) {
		overallStatus = 'exceeded';
	} else if (warningCount > 0) {
		overallStatus = 'warning';
	} else {
		overallStatus = 'ok';
	}

	const summary =
		budgets.length === 0
			? 'Nenhum orçamento definido.'
			: exceededCount > 0
				? `🚨 ${exceededCount} orçamento(s) excedido(s)! ${warningCount > 0 ? `Além disso, ${warningCount} está(ão) próximo(s) do limite.` : ''}`
				: warningCount > 0
					? `⚠️ ${warningCount} orçamento(s) próximo(s) do limite.`
					: `✅ Todos os ${budgets.length} orçamento(s) dentro do limite.`;

	return {
		budgets,
		overallStatus,
		summary,
	};
}
