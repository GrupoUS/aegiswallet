import { and, desc, eq, gte, ilike, inArray, lte } from 'drizzle-orm';
import { z } from 'zod';

import { filterSensitiveData } from '../security/filter';
import type { HttpClient } from '@/db/client';
import { transactionCategories, transactions } from '@/db/schema';

export function createTransactionTools(userId: string, db: HttpClient) {
	const listTransactionsSchema = z.object({
		startDate: z
			.string()
			.datetime()
			.optional()
			.describe('Data inicial no formato ISO (YYYY-MM-DD)'),
		endDate: z.string().datetime().optional().describe('Data final no formato ISO (YYYY-MM-DD)'),
		categoryId: z.string().uuid().optional().describe('ID da categoria para filtrar'),
		accountId: z.string().uuid().optional().describe('ID da conta para filtrar'),
		minAmount: z.number().optional().describe('Valor mínimo da transação'),
		maxAmount: z.number().optional().describe('Valor máximo da transação'),
		searchTerm: z.string().optional().describe('Termo para buscar na descrição'),
		limit: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
		offset: z.number().min(0).default(0).describe('Pular N resultados para paginação'),
	});

	const getTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação'),
	});

	const createTransactionSchema = z.object({
		amount: z
			.number()
			.describe('Valor da transação (positivo para receita, negativo para despesa)'),
		description: z.string().min(1).max(255).describe('Descrição da transação'),
		categoryId: z.string().uuid().optional().describe('ID da categoria'),
		accountId: z.string().uuid().optional().describe('ID da conta bancária'),
		transactionDate: z.string().datetime().optional().describe('Data da transação (padrão: agora)'),
		merchantName: z.string().optional().describe('Nome do estabelecimento'),
	});

	const updateTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação a atualizar'),
		amount: z.number().optional().describe('Novo valor'),
		description: z.string().min(1).max(255).optional().describe('Nova descrição'),
		categoryId: z.string().uuid().optional().describe('Nova categoria'),
		transactionDate: z.string().datetime().optional().describe('Nova data'),
		merchantName: z.string().optional().describe('Novo estabelecimento'),
	});

	const deleteTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação'),
	});

	const getSpendingSummarySchema = z.object({
		startDate: z.string().datetime().describe('Data inicial'),
		endDate: z.string().datetime().describe('Data final'),
	});

	return {
		listTransactions: {
			description:
				'Lista transações do usuário com filtros opcionais. Use para consultar histórico, buscar por período ou categoria.',
			parameters: listTransactionsSchema,
			execute: async (args: z.infer<typeof listTransactionsSchema>) => {
				const {
					startDate,
					endDate,
					categoryId,
					accountId,
					minAmount,
					maxAmount,
					searchTerm,
					limit,
					offset,
				} = args;

				// Build conditions array
				const conditions = [eq(transactions.userId, userId)];

				if (startDate) conditions.push(gte(transactions.transactionDate, new Date(startDate)));
				if (endDate) conditions.push(lte(transactions.transactionDate, new Date(endDate)));
				if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
				if (accountId) conditions.push(eq(transactions.accountId, accountId));
				if (minAmount) conditions.push(gte(transactions.amount, String(minAmount)));
				if (maxAmount) conditions.push(lte(transactions.amount, String(maxAmount)));
				if (searchTerm) conditions.push(ilike(transactions.description, `%${searchTerm}%`));

				const data = await db
					.select({
						id: transactions.id,
						amount: transactions.amount,
						description: transactions.description,
						merchantName: transactions.merchantName,
						transactionDate: transactions.transactionDate,
						status: transactions.status,
						createdAt: transactions.createdAt,
					})
					.from(transactions)
					.where(and(...conditions))
					.orderBy(desc(transactions.transactionDate))
					.limit(limit)
					.offset(offset);

				return {
					transactions: data.map(filterSensitiveData),
					total: data.length,
					hasMore: data.length === limit,
				};
			},
		},

		getTransaction: {
			description: 'Obtém detalhes de uma transação específica pelo ID.',
			parameters: getTransactionSchema,
			execute: async (args: z.infer<typeof getTransactionSchema>) => {
				const { transactionId } = args;
				const [data] = await db
					.select()
					.from(transactions)
					.where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
					.limit(1);

				if (!data) {
					throw new Error('Transação não encontrada');
				}

				return filterSensitiveData(data);
			},
		},

		createTransaction: {
			description: 'Cria uma nova transação manual para o usuário.',
			parameters: createTransactionSchema,
			execute: async (args: z.infer<typeof createTransactionSchema>) => {
				const { amount, description, categoryId, accountId, transactionDate, merchantName } = args;

				const [data] = await db
					.insert(transactions)
					.values({
						userId,
						amount: String(amount),
						description,
						categoryId,
						accountId,
						transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
						merchantName,
						transactionType: amount >= 0 ? 'credit' : 'debit',
						status: 'posted',
						isManualEntry: true,
					})
					.returning();

				return { success: true, transaction: filterSensitiveData(data) };
			},
		},

		updateTransaction: {
			description: 'Atualiza uma transação existente do usuário.',
			parameters: updateTransactionSchema,
			execute: async (args: z.infer<typeof updateTransactionSchema>) => {
				const { transactionId, ...updates } = args;

				// Build update object dynamically
				const updateData: Record<string, unknown> = {
					updatedAt: new Date(),
				};

				if (updates.amount !== undefined) updateData.amount = String(updates.amount);
				if (updates.description !== undefined) updateData.description = updates.description;
				if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
				if (updates.transactionDate !== undefined)
					updateData.transactionDate = new Date(updates.transactionDate);
				if (updates.merchantName !== undefined) updateData.merchantName = updates.merchantName;

				const [data] = await db
					.update(transactions)
					.set(updateData)
					.where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
					.returning();

				if (!data) {
					throw new Error('Transação não encontrada');
				}

				return { success: true, transaction: filterSensitiveData(data) };
			},
		},

		deleteTransaction: {
			description: 'Deleta uma transação. Use com cuidado, esta ação é irreversível.',
			parameters: deleteTransactionSchema,
			execute: async (args: z.infer<typeof deleteTransactionSchema>) => {
				const { transactionId } = args;

				const [deleted] = await db
					.delete(transactions)
					.where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
					.returning({ id: transactions.id });

				if (!deleted) {
					throw new Error('Transação não encontrada');
				}

				return { success: true, message: 'Transação deletada com sucesso.' };
			},
		},

		getSpendingSummary: {
			description: 'Obtém resumo de gastos por categoria em um período.',
			parameters: getSpendingSummarySchema,
			execute: async (args: z.infer<typeof getSpendingSummarySchema>) => {
				const { startDate, endDate } = args;

				const data = await db
					.select({
						amount: transactions.amount,
						categoryId: transactions.categoryId,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.userId, userId),
							lte(transactions.amount, '0'), // Only expenses (negative amounts)
							gte(transactions.transactionDate, new Date(startDate)),
							lte(transactions.transactionDate, new Date(endDate)),
						),
					);

				// Get category info
				const categoryIds = [...new Set(data.map((t) => t.categoryId).filter(Boolean))] as string[];
				const categories = categoryIds.length
					? await db
							.select({
								id: transactionCategories.id,
								name: transactionCategories.name,
								color: transactionCategories.color,
							})
							.from(transactionCategories)
							.where(inArray(transactionCategories.id, categoryIds))
					: [];

				const categoryMap = new Map(categories.map((c) => [c.id, c]));

				// Group by category
				const summary = data.reduce(
					(acc, tx) => {
						const catId = tx.categoryId ?? 'uncategorized';
						const cat = categoryMap.get(tx.categoryId ?? '');

						if (!acc[catId]) {
							acc[catId] = {
								categoryId: catId,
								categoryName: cat?.name ?? 'Sem categoria',
								color: cat?.color ?? '#6B7280',
								total: 0,
								count: 0,
							};
						}

						acc[catId].total += Math.abs(Number(tx.amount));
						acc[catId].count += 1;

						return acc;
					},
					{} as Record<
						string,
						{
							categoryId: string;
							categoryName: string;
							color: string;
							total: number;
							count: number;
						}
					>,
				);

				const categorySummary = Object.values(summary).sort((a, b) => b.total - a.total);
				const grandTotal = categorySummary.reduce((sum, cat) => sum + cat.total, 0);

				return {
					period: { startDate, endDate },
					grandTotal,
					categories: categorySummary,
				};
			},
		},
	};
}
