import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { filterSensitiveData } from '../security/filter';
import type { HttpClient } from '@/db/client';
import { bankAccounts } from '@/db/schema';

export function createAccountTools(userId: string, db: HttpClient) {
	const listAccountsSchema = z.object({
		includeInactive: z.boolean().default(false).describe('Incluir contas inativas'),
	});

	const getAccountBalanceSchema = z.object({
		accountId: z.string().uuid().optional().describe('ID da conta (omitir para total)'),
	});

	return {
		listAccounts: {
			description: 'Lista todas as contas bancárias do usuário.',
			parameters: listAccountsSchema,
			execute: async (args: z.infer<typeof listAccountsSchema>) => {
				const { includeInactive } = args;

				const conditions = [eq(bankAccounts.userId, userId)];
				if (!includeInactive) {
					conditions.push(eq(bankAccounts.isActive, true));
				}

				const data = await db
					.select({
						id: bankAccounts.id,
						institutionName: bankAccounts.institutionName,
						accountType: bankAccounts.accountType,
						balance: bankAccounts.balance,
						availableBalance: bankAccounts.availableBalance,
						currency: bankAccounts.currency,
						isActive: bankAccounts.isActive,
						isPrimary: bankAccounts.isPrimary,
						lastSync: bankAccounts.lastSync,
					})
					.from(bankAccounts)
					.where(and(...conditions))
					.orderBy(desc(bankAccounts.isPrimary));

				const totalBalance = data.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0);

				return {
					accounts: data.map(filterSensitiveData),
					totalBalance,
					count: data.length,
				};
			},
		},

		getAccountBalance: {
			description: 'Obtém saldo atual de uma conta específica ou total de todas as contas.',
			parameters: getAccountBalanceSchema,
			execute: async (args: z.infer<typeof getAccountBalanceSchema>) => {
				const { accountId } = args;

				if (accountId) {
					const [accountData] = await db
						.select({
							id: bankAccounts.id,
							institutionName: bankAccounts.institutionName,
							balance: bankAccounts.balance,
							availableBalance: bankAccounts.availableBalance,
							currency: bankAccounts.currency,
							lastSync: bankAccounts.lastSync,
						})
						.from(bankAccounts)
						.where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
						.limit(1);

					if (!accountData) {
						throw new Error('Conta não encontrada');
					}

					return filterSensitiveData(accountData);
				}

				// Total of all active accounts
				const data = await db
					.select({
						balance: bankAccounts.balance,
						availableBalance: bankAccounts.availableBalance,
						currency: bankAccounts.currency,
					})
					.from(bankAccounts)
					.where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)));

				const totalBalance = data.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0);
				const totalAvailable = data.reduce(
					(sum, acc) => sum + Number(acc.availableBalance ?? 0),
					0,
				);

				return {
					totalBalance,
					totalAvailable,
					currency: 'BRL',
					accountCount: data.length,
				};
			},
		},
	};
}
