import { getPoolClient } from '../src/db/client';

async function checkBankAccountsSchema() {
	const db = getPoolClient();

	console.log('🔍 Checking bank_accounts table schema...\n');

	// Check schema
	const schemaResult = await db.execute(`
		SELECT column_name, is_nullable, data_type, column_default
		FROM information_schema.columns
		WHERE table_name = 'bank_accounts'
		ORDER BY ordinal_position
	`);

	console.log('📊 bank_accounts schema:');
	console.table(schemaResult.rows);

	// Check existing bank accounts
	const accountsResult = await db.execute(`
		SELECT id, user_id, institution_name, account_type, belvo_account_id
		FROM bank_accounts
		LIMIT 10
	`);

	console.log('\n📦 Existing bank accounts:');
	console.table(accountsResult.rows);

	// Check foreign key constraints
	const fkResult = await db.execute(`
		SELECT
			tc.constraint_name,
			tc.table_name,
			kcu.column_name,
			ccu.table_name AS foreign_table_name,
			ccu.column_name AS foreign_column_name
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
		JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
		WHERE tc.constraint_type = 'FOREIGN KEY'
			AND tc.table_name = 'bank_accounts'
	`);

	console.log('\n🔗 Foreign key constraints on bank_accounts:');
	console.table(fkResult.rows);

	// Check if users table has the expected users
	const usersResult = await db.execute(`
		SELECT id, email, full_name, created_at
		FROM users
		ORDER BY created_at DESC
		LIMIT 5
	`);

	console.log('\n👤 Users in database:');
	console.table(usersResult.rows);
}

checkBankAccountsSchema()
	.then(() => {
		console.log('\n✅ Schema check complete');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
