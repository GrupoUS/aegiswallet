/**
 * Validate user integrity and relationships in the database
 * Checks for orphaned records and data consistency issues
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const validateUserIntegrity = async () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	const sql = neon(databaseUrl);
	const db = drizzle(sql);

	console.log('\n🔍 Validating User Data Integrity...\n');

	try {
		// Check total users count
		const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
		console.log(`📊 Total Users: ${usersCount[0].count}`);

		// Check users with emails
		const usersWithEmail = await sql`
			SELECT COUNT(*) as count 
			FROM users 
			WHERE email IS NOT NULL AND email != ''
		`;
		console.log(`📧 Users with Email: ${usersWithEmail[0].count}`);

		// Check for NULL user_id in related tables
		const tablesToCheck = [
			{ name: 'transaction_categories', description: 'Transaction Categories' },
			{ name: 'transactions', description: 'Transactions' },
			{ name: 'bank_accounts', description: 'Bank Accounts' },
			{ name: 'subscriptions', description: 'Subscriptions' },
		];

		for (const table of tablesToCheck) {
			try {
				const nullCheck = await sql`
					SELECT COUNT(*) as count 
					FROM information_schema.columns 
					WHERE table_name = ${table.name} 
					AND column_name = 'user_id'
				`;
				
				if (nullCheck[0].count > 0) {
					const result = await sql`
						SELECT COUNT(*) as count 
						FROM ${sql(table.name)} 
						WHERE user_id IS NULL
					`;
					const nullCount = result[0].count;
					
					if (nullCount > 0) {
						console.log(`⚠️  ${table.description}: ${nullCount} records with NULL user_id`);
					} else {
						console.log(`✅ ${table.description}: All records have valid user_id`);
					}
				}
			} catch (error) {
				console.log(`ℹ️  ${table.description}: Table not found or no user_id column`);
			}
		}

		// Check for orphaned subscriptions (subscriptions without users)
		try {
			const orphanedSubscriptions = await sql`
				SELECT COUNT(*) as count 
				FROM subscriptions s
				LEFT JOIN users u ON s.user_id = u.id
				WHERE u.id IS NULL
			`;
			
			if (orphanedSubscriptions[0].count > 0) {
				console.log(`⚠️  Orphaned Subscriptions: ${orphanedSubscriptions[0].count} records without valid users`);
				
				// Show details of orphaned subscriptions
				const details = await sql`
					SELECT s.id, s.user_id, s.status, s.created_at
					FROM subscriptions s
					LEFT JOIN users u ON s.user_id = u.id
					WHERE u.id IS NULL
					LIMIT 5
				`;
				
				if (details.length > 0) {
					console.log('\n   Sample orphaned subscriptions:');
					details.forEach((sub) => {
						console.log(`   - ID: ${sub.id}, User ID: ${sub.user_id}, Status: ${sub.status}`);
					});
				}
			} else {
				console.log('✅ Subscriptions: All have valid user references');
			}
		} catch (error) {
			console.log('ℹ️  Subscriptions: Table not found');
		}

		// Check recent user creation activity
		const recentUsers = await sql`
			SELECT COUNT(*) as count
			FROM users
			WHERE created_at >= NOW() - INTERVAL '24 hours'
		`;
		console.log(`🆕 Users created in last 24 hours: ${recentUsers[0].count}`);

		// Check database connection health
		console.log('\n🏥 Database Health Check:');
		const now = await sql`SELECT NOW() as server_time`;
		console.log(`   Server Time: ${now[0].server_time}`);

		console.log('\n✅ User integrity validation completed');

	} catch (error) {
		console.error('❌ Error validating user integrity:', error);
		process.exit(1);
	}
};

validateUserIntegrity();
