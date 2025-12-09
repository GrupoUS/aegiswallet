/**
 * Quick Database Check Script
 * Checks current state of users and bank accounts
 */

import { sql } from 'drizzle-orm';

import { closePool, getPoolClient } from '../src/db/client';

async function checkDatabase() {
	console.log('🔍 Checking Database State...\n');

	const client = await getPoolClient();

	try {
		// Check users
		const users = await client.execute(sql`SELECT id, email, organization_id FROM users`);
		console.log(`📋 Users (${users.rows.length}):`);
		for (const user of users.rows) {
			console.log(`   - ${user.id} | ${user.email} | org: ${user.organization_id}`);
		}

		// Check bank accounts
		const accounts = await client.execute(sql`
			SELECT id, user_id, institution_name, account_type, balance
			FROM bank_accounts
		`);
		console.log(`\n🏦 Bank Accounts (${accounts.rows.length}):`);
		for (const acc of accounts.rows) {
			console.log(
				`   - ${acc.id} | user: ${acc.user_id} | ${acc.institution_name} | ${acc.account_type} | R$ ${acc.balance}`,
			);
		}

		// Check transactions
		const transactions = await client.execute(sql`
			SELECT id, user_id, description, amount, transaction_type
			FROM transactions
			LIMIT 5
		`);
		console.log(`\n💸 Transactions (showing up to 5):`);
		for (const tx of transactions.rows) {
			console.log(
				`   - ${tx.id} | user: ${tx.user_id} | ${tx.description} | R$ ${tx.amount} | ${tx.transaction_type}`,
			);
		}

		console.log('\n✅ Database check complete!');
	} catch (error) {
		console.error('❌ Error:', error instanceof Error ? error.message : error);
	} finally {
		await closePool();
	}
}

checkDatabase();
