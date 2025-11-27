import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { filterSensitiveData } from '../security/filter';

export function createTransactionTools(
	userId: string,
	supabase: SupabaseClient,
) {
	const listTransactionsSchema = z.object({
		startDate: z
			.string()
			.datetime()
			.optional()
			.describe('Data inicial no formato ISO (YYYY-MM-DD)'),
		endDate: z
			.string()
			.datetime()
			.optional()
			.describe('Data final no formato ISO (YYYY-MM-DD)'),
		categoryId: z
			.string()
			.uuid()
			.optional()
			.describe('ID da categoria para filtrar'),
		accountId: z
			.string()
			.uuid()
			.optional()
			.describe('ID da conta para filtrar'),
		minAmount: z.number().optional().describe('Valor mínimo da transação'),
		maxAmount: z.number().optional().describe('Valor máximo da transação'),
		searchTerm: z
			.string()
			.optional()
			.describe('Termo para buscar na descrição'),
		limit: z
			.number()
			.min(1)
			.max(100)
			.default(20)
			.describe('Número máximo de resultados'),
		offset: z
			.number()
			.min(0)
			.default(0)
			.describe('Pular N resultados para paginação'),
	});

	const getTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação'),
	});

	const createTransactionSchema = z.object({
		amount: z
			.number()
			.describe(
				'Valor da transação (positivo para receita, negativo para despesa)',
			),
		description: z.string().min(1).max(255).describe('Descrição da transação'),
		categoryId: z.string().uuid().optional().describe('ID da categoria'),
		accountId: z.string().uuid().optional().describe('ID da conta bancária'),
		transactionDate: z
			.string()
			.datetime()
			.optional()
			.describe('Data da transação (padrão: agora)'),
		merchantName: z.string().optional().describe('Nome do estabelecimento'),
	});

	const updateTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação a atualizar'),
		amount: z.number().optional().describe('Novo valor'),
		description: z
			.string()
			.min(1)
			.max(255)
			.optional()
			.describe('Nova descrição'),
		categoryId: z.string().uuid().optional().describe('Nova categoria'),
		transactionDate: z.string().datetime().optional().describe('Nova data'),
		merchantName: z.string().optional().describe('Novo estabelecimento'),
	});

	const requestDeleteConfirmationSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação a deletar'),
	});

	const deleteTransactionSchema = z.object({
		transactionId: z.string().uuid().describe('ID da transação'),
		confirmationToken: z.string().uuid().describe('Token de confirmação'),
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
				let query = supabase
					.from('transactions')
					.select(`
            id,
            amount,
            description,
            merchant_name,
            transaction_date,
            status,
            created_at,
            category:transaction_categories(id, name, color, icon),
            account:bank_accounts(id, institution_name, account_type)
          `)
					.eq('user_id', userId)
					.order('transaction_date', { ascending: false })
					.range(offset, offset + limit - 1);

				if (startDate) query = query.gte('transaction_date', startDate);
				if (endDate) query = query.lte('transaction_date', endDate);
				if (categoryId) query = query.eq('category_id', categoryId);
				if (accountId) query = query.eq('account_id', accountId);
				if (minAmount) query = query.gte('amount', minAmount);
				if (maxAmount) query = query.lte('amount', maxAmount);
				if (searchTerm) query = query.ilike('description', `%${searchTerm}%`);

				const { data, error, count } = await query;

				if (error)
					throw new Error(`Erro ao buscar transações: ${error.message}`);

				return {
					transactions: data?.map(filterSensitiveData) ?? [],
					total: count ?? 0,
					hasMore: (count ?? 0) > offset + limit,
				};
			},
		},

		getTransaction: {
			description: 'Obtém detalhes de uma transação específica pelo ID.',
			parameters: getTransactionSchema,
			execute: async (args: z.infer<typeof getTransactionSchema>) => {
				const { transactionId } = args;
				const { data, error } = await supabase
					.from('transactions')
					.select(`
            *,
            category:transaction_categories(id, name, color, icon),
            account:bank_accounts(id, institution_name, account_type)
          `)
					.eq('id', transactionId)
					.eq('user_id', userId)
					.single();

				if (error)
					throw new Error(`Transação não encontrada: ${error.message}`);

				return filterSensitiveData(data);
			},
		},

		createTransaction: {
			description: 'Cria uma nova transação manual para o usuário.',
			parameters: createTransactionSchema,
			execute: async (args: z.infer<typeof createTransactionSchema>) => {
				const {
					amount,
					description,
					categoryId,
					accountId,
					transactionDate,
					merchantName,
				} = args;
				const { data, error } = await supabase
					.from('transactions')
					.insert({
						user_id: userId,
						amount,
						description,
						category_id: categoryId,
						account_id: accountId,
						transaction_date: transactionDate ?? new Date().toISOString(),
						merchant_name: merchantName,
						status: 'posted',
					})
					.select()
					.single();

				if (error) throw new Error(`Erro ao criar transação: ${error.message}`);

				return { success: true, transaction: filterSensitiveData(data) };
			},
		},

		updateTransaction: {
			description: 'Atualiza uma transação existente do usuário.',
			parameters: updateTransactionSchema,
			execute: async (args: z.infer<typeof updateTransactionSchema>) => {
				const { transactionId, ...updates } = args;
				// Remover campos undefined
				const cleanUpdates = Object.fromEntries(
					Object.entries(updates).filter(([, v]) => v !== undefined),
				);

				const { data, error } = await supabase
					.from('transactions')
					.update({
						...cleanUpdates,
						category_id: updates.categoryId,
						transaction_date: updates.transactionDate,
						merchant_name: updates.merchantName,
						updated_at: new Date().toISOString(),
					})
					.eq('id', transactionId)
					.eq('user_id', userId)
					.select()
					.single();

				if (error) throw new Error(`Erro ao atualizar: ${error.message}`);

				return { success: true, transaction: filterSensitiveData(data) };
			},
		},

		requestDeleteConfirmation: {
			description:
				'Solicita confirmação antes de deletar uma transação. SEMPRE use esta tool antes de deleteTransaction.',
			parameters: requestDeleteConfirmationSchema,
			execute: async (
				args: z.infer<typeof requestDeleteConfirmationSchema>,
			) => {
				const { transactionId } = args;
				const { data, error } = await supabase
					.from('transactions')
					.select('id, amount, description, transaction_date')
					.eq('id', transactionId)
					.eq('user_id', userId)
					.single();

				if (error)
					throw new Error(`Transação não encontrada: ${error.message}`);

				// Gerar token temporário (expira em 60s)
				const token = crypto.randomUUID();
				const expiresAt = new Date(Date.now() + 60000).toISOString();

				// Armazenar token (em produção, usar Redis ou similar)
				await supabase.from('delete_confirmations').insert({
					token,
					transaction_id: transactionId,
					user_id: userId,
					expires_at: expiresAt,
				});

				return {
					requiresConfirmation: true,
					confirmationToken: token,
					expiresIn: 60,
					summary: {
						id: data.id,
						description: data.description,
						amount: data.amount,
						date: data.transaction_date,
					},
					message: `Para confirmar a exclusão da transação "${data.description}" (R$ ${Math.abs(data.amount).toFixed(2)}), peça ao usuário que confirme.`,
				};
			},
		},

		deleteTransaction: {
			description:
				'Deleta uma transação. REQUER confirmationToken obtido via requestDeleteConfirmation.',
			parameters: deleteTransactionSchema,
			execute: async (args: z.infer<typeof deleteTransactionSchema>) => {
				const { transactionId, confirmationToken } = args;
				// Verificar token
				const { data: confirmation, error: tokenError } = await supabase
					.from('delete_confirmations')
					.select('*')
					.eq('token', confirmationToken)
					.eq('transaction_id', transactionId)
					.eq('user_id', userId)
					.gt('expires_at', new Date().toISOString())
					.single();

				if (tokenError || !confirmation) {
					throw new Error(
						'Token de confirmação inválido ou expirado. Use requestDeleteConfirmation primeiro.',
					);
				}

				// Deletar transação
				const { error: deleteError } = await supabase
					.from('transactions')
					.delete()
					.eq('id', transactionId)
					.eq('user_id', userId);

				if (deleteError)
					throw new Error(`Erro ao deletar: ${deleteError.message}`);

				// Limpar token usado
				await supabase
					.from('delete_confirmations')
					.delete()
					.eq('token', confirmationToken);

				return { success: true, message: 'Transação deletada com sucesso.' };
			},
		},

		getSpendingSummary: {
			description: 'Obtém resumo de gastos por categoria em um período.',
			parameters: getSpendingSummarySchema,
			execute: async (args: z.infer<typeof getSpendingSummarySchema>) => {
				const { startDate, endDate } = args;
				const { data, error } = await supabase
					.from('transactions')
					.select(`
            amount,
            category:transaction_categories(id, name, color)
          `)
					.eq('user_id', userId)
					.lt('amount', 0) // Apenas despesas
					.gte('transaction_date', startDate)
					.lte('transaction_date', endDate);

				if (error) throw new Error(`Erro: ${error.message}`);

				// Agrupar por categoria
				const summary = data?.reduce(
					(acc, tx) => {
						const cat = Array.isArray(tx.category)
							? tx.category[0]
							: tx.category;
						const catName = cat?.name ?? 'Sem categoria';
						const catId = cat?.id ?? 'uncategorized';

						if (!acc[catId]) {
							acc[catId] = {
								categoryId: catId,
								categoryName: catName,
								color: cat?.color ?? '#6B7280',
								total: 0,
								count: 0,
							};
						}

						acc[catId].total += Math.abs(tx.amount);
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

				const categories = Object.values(summary ?? {}).sort(
					(a, b) => b.total - a.total,
				);
				const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0);

				return {
					period: { startDate, endDate },
					grandTotal,
					categories,
				};
			},
		},
	};
}
