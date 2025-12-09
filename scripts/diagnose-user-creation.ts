import { getPoolClient } from '../src/db/client';
import { users } from '../src/db/schema';

async function diagnoseUserCreation() {
	const db = getPoolClient();

	console.log('🔍 Diagnosing user creation issue...\n');

	// 1. List all users
	const allUsers = await db.execute(
		`SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC`,
	);
	console.log('📊 All users in database:');
	console.table(allUsers.rows);

	// 2. Check if there are any bank accounts with user_ids that don't exist in users table
	const orphanAccounts = await db.execute(`
		SELECT ba.id, ba.user_id, ba.institution_name
		FROM bank_accounts ba
		LEFT JOIN users u ON ba.user_id = u.id
		WHERE u.id IS NULL
	`);
	console.log('\n⚠️ Orphan bank accounts (user_id not in users table):');
	console.table(orphanAccounts.rows);

	// 3. Check subscriptions table for users
	const subscriptions = await db.execute(
		`SELECT user_id, stripe_customer_id, plan_id, status FROM subscriptions`,
	);
	console.log('\n💳 Subscriptions:');
	console.table(subscriptions.rows);

	// 4. Check if subscription user_ids exist in users table
	const orphanSubscriptions = await db.execute(`
		SELECT s.user_id, s.stripe_customer_id
		FROM subscriptions s
		LEFT JOIN users u ON s.user_id = u.id
		WHERE u.id IS NULL
	`);
	console.log('\n⚠️ Orphan subscriptions (user_id not in users table):');
	console.table(orphanSubscriptions.rows);

	// 5. Summary
	console.log('\n📋 DIAGNOSIS SUMMARY:');
	console.log('====================');
	console.log(`Total users: ${(allUsers.rows as unknown[]).length}`);
	console.log(`Orphan bank accounts: ${(orphanAccounts.rows as unknown[]).length}`);
	console.log(`Orphan subscriptions: ${(orphanSubscriptions.rows as unknown[]).length}`);

	if ((orphanSubscriptions.rows as unknown[]).length > 0) {
		console.log('\n🔴 PROBLEM DETECTED:');
		console.log('There are subscriptions for users that do not exist in the users table.');
		console.log(
			'This means the Clerk webhook is creating subscriptions but NOT creating user records.',
		);
		console.log('\nThe fix we applied to clerk.ts should resolve this for NEW users.');
		console.log('For EXISTING users, we need to manually insert them into the users table.');
	}
}

diagnoseUserCreation()
	.then(() => {
		console.log('\n✅ Diagnosis complete');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
