/**
 * Get Account Balances Handler
 *
 * Retrieves current balances from all user bank accounts
 * Returns accounts with balance info and Portuguese summary
 */

import { and, eq } from 'drizzle-orm';

import type { GetAccountBalancesInput } from '../schemas';
import { db } from '@/db/client';
import { bankAccounts } from '@/db/schema';

export interface AccountBalanceResult {
	accounts: Array<{
		id: string;
		institutionName: string;
		accountType: string;
		balance: number;
		availableBalance: number;
		currency: string;
		lastSync: Date | null;
	}>;
	totalBalance: number;
	totalAvailable: number;
	summary: string; // Human-readable summary in Portuguese
}

export async function getAccountBalances(
	userId: string,
	input: GetAccountBalancesInput,
): Promise<AccountBalanceResult> {
	const { includeInactive = false } = input;

	const whereClause = includeInactive
		? eq(bankAccounts.userId, userId)
		: and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true));

	const accounts = await db
		.select({
			id: bankAccounts.id,
			institutionName: bankAccounts.institutionName,
			accountType: bankAccounts.accountType,
			balance: bankAccounts.balance,
			availableBalance: bankAccounts.availableBalance,
			currency: bankAccounts.currency,
			lastSync: bankAccounts.lastSync,
		})
		.from(bankAccounts)
		.where(whereClause);

	const mappedAccounts = accounts.map((acc) => ({
		id: acc.id,
		institutionName: acc.institutionName,
		accountType: acc.accountType,
		balance: Number(acc.balance || 0),
		availableBalance: Number(acc.availableBalance || 0),
		currency: acc.currency || 'BRL',
		lastSync: acc.lastSync,
	}));

	const totalBalance = mappedAccounts.reduce(
		(sum, acc) => sum + acc.balance,
		0,
	);
	const totalAvailable = mappedAccounts.reduce(
		(sum, acc) => sum + acc.availableBalance,
		0,
	);

	// Generate human-readable summary in Portuguese
	const summary =
		mappedAccounts.length === 0
			? 'Nenhuma conta bancária encontrada.'
			: `${mappedAccounts.length} conta(s) com saldo total de R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (R$ ${totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponível).`;

	return {
		accounts: mappedAccounts,
		totalBalance,
		totalAvailable,
		summary,
	};
}
