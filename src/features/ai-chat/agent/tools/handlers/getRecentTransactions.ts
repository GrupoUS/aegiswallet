/**
 * Get Recent Transactions Handler
 *
 * Retrieves recent transactions with optional filters
 * Returns transactions with category info and Portuguese summary
 */

import { and, desc, eq, gte, lte } from 'drizzle-orm';

import type { GetTransactionsInput } from '../schemas';
import { db } from '@/db/client';
import { transactionCategories, transactions } from '@/db/schema';

export interface TransactionResult {
	transactions: Array<{
		id: string;
		description: string;
		amount: number;
		transactionType: string;
		categoryName: string | null;
		transactionDate: Date;
		merchantName: string | null;
	}>;
	count: number;
	summary: string;
}

export async function getRecentTransactions(
	userId: string,
	input: GetTransactionsInput,
): Promise<TransactionResult> {
	const { startDate, endDate, categoryId, type, limit = 20 } = input;

	// Build where conditions dynamically
	const conditions = [eq(transactions.userId, userId)];

	if (startDate) {
		conditions.push(gte(transactions.transactionDate, new Date(startDate)));
	}
	if (endDate) {
		conditions.push(lte(transactions.transactionDate, new Date(endDate)));
	}
	if (categoryId) {
		conditions.push(eq(transactions.categoryId, categoryId));
	}
	if (type) {
		conditions.push(eq(transactions.transactionType, type));
	}

	const result = await db
		.select({
			id: transactions.id,
			description: transactions.description,
			amount: transactions.amount,
			transactionType: transactions.transactionType,
			transactionDate: transactions.transactionDate,
			merchantName: transactions.merchantName,
			categoryName: transactionCategories.name,
		})
		.from(transactions)
		.leftJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
		.where(and(...conditions))
		.orderBy(desc(transactions.transactionDate))
		.limit(limit);

	const mappedTransactions = result.map((t) => ({
		id: t.id,
		description: t.description,
		amount: Number(t.amount),
		transactionType: t.transactionType,
		categoryName: t.categoryName,
		transactionDate: t.transactionDate,
		merchantName: t.merchantName,
	}));

	// Generate summary
	const totalDebits = mappedTransactions
		.filter((t) => t.transactionType === 'debit')
		.reduce((sum, t) => sum + Math.abs(t.amount), 0);
	const totalCredits = mappedTransactions
		.filter((t) => t.transactionType === 'credit')
		.reduce((sum, t) => sum + t.amount, 0);

	const summary =
		mappedTransactions.length === 0
			? 'Nenhuma transação encontrada no período.'
			: `${mappedTransactions.length} transação(ões): R$ ${totalCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em entradas, R$ ${totalDebits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em saídas.`;

	return {
		transactions: mappedTransactions,
		count: mappedTransactions.length,
		summary,
	};
}
