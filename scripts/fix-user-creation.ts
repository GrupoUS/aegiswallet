/**
 * Fix user creation issues by validating and repairing the system
 * This script will help identify and resolve problems preventing new user registration
 */

import crypto from 'crypto';

import { neon } from '@neondatabase/serverless';

const fixUserCreation = async () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	const sql = neon(databaseUrl);

	console.log('\n🔧 Fixing User Creation Issues\n');

	try {
		// 1. Check database schema for user table
		console.log('1️⃣ Checking User Table Schema');
		console.log('==================================');

		const userTableInfo = await sql`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_name = 'users'
			ORDER BY ordinal_position
		`;

		console.log('User table columns:');
		userTableInfo.forEach((col) => {
			const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
			console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}`);
		});

		// 2. Check for any missing required columns
		console.log('\n2️⃣ Validating Required Columns');
		console.log('==================================');

		const requiredColumns = ['id', 'email', 'created_at', 'updated_at'];
		const existingColumns = userTableInfo.map((col) => col.column_name);
		const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col));

		if (missingColumns.length > 0) {
			console.log(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
		} else {
			console.log('✅ All required columns present');
		}

		// 3. Check if there are any recent failed user creation attempts
		console.log('\n3️⃣ Checking Recent User Creation');
		console.log('===================================');

		const recentUsers = await sql`
			SELECT 
				id,
				email,
				created_at,
				full_name
			FROM users
			ORDER BY created_at DESC
			LIMIT 5
		`;

		if (recentUsers.length === 0) {
			console.log('ℹ️  No users found in database');
		} else {
			console.log(`Found ${recentUsers.length} recent users:`);
			recentUsers.forEach((user) => {
				const name = user.full_name || 'No name';
				console.log(`  - ${user.email} (${name}) - Created: ${user.created_at}`);
			});
		}

		// 4. Check webhook endpoint health
		console.log('\n4️⃣ Checking Webhook Configuration');
		console.log('====================================');

		const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.log('❌ CLERK_WEBHOOK_SECRET not configured');
			console.log('\n   To fix:');
			console.log('   1. Go to Clerk Dashboard → Webhooks');
			console.log('   2. Copy the webhook signing secret');
			console.log('   3. Add to .env: CLERK_WEBHOOK_SECRET=whsec_...');
		} else {
			console.log('✅ Webhook secret configured');

			if (webhookSecret.startsWith('whsec_')) {
				console.log('✅ Valid webhook secret format');
			} else {
				console.log('⚠️  Webhook secret should start with "whsec_"');
			}
		}

		// 5. Test database insert operation
		console.log('\n5️⃣ Testing Database Operations');
		console.log('================================');

		const testUserId = `test_${crypto.randomUUID()}`;
		const now = new Date().toISOString();

		try {
			// Start a transaction to test insert
			await sql.begin(async (tx) => {
				// Insert a test user record
				await tx`
					INSERT INTO users (id, email, created_at, updated_at)
					VALUES (${testUserId}, 'test@example.com', ${now}, ${now})
					ON CONFLICT (id) DO NOTHING
				`;

				// Verify the insert
				const result = await tx`
					SELECT id FROM users WHERE id = ${testUserId}
				`;

				if (result.length > 0) {
					console.log('✅ Database insert operation successful');

					// Clean up test record
					await tx`
						DELETE FROM users WHERE id = ${testUserId}
					`;
					console.log('✅ Test record cleaned up');
				} else {
					console.log('⚠️  Insert may have failed or was rolled back');
				}
			});
		} catch (error) {
			console.log(
				'❌ Database insert test failed:',
				error instanceof Error ? error.message : error,
			);
		}

		// 6. Check for constraints that might block user creation
		console.log('\n6️⃣ Checking Database Constraints');
		console.log('==================================');

		const constraints = await sql`
			SELECT 
				constraint_name,
				constraint_type,
				table_name
			FROM information_schema.table_constraints
			WHERE table_name = 'users'
			AND constraint_type != 'CHECK'
		`;

		if (constraints.length > 0) {
			console.log('User table constraints:');
			constraints.forEach((con) => {
				console.log(`  - ${con.constraint_name}: ${con.constraint_type}`);
			});
		} else {
			console.log('ℹ️  No foreign key or unique constraints found');
		}

		// 7. Generate a diagnostic report
		console.log('\n7️⃣ Diagnostic Report');
		console.log('=====================');

		const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
		console.log(`Total users in database: ${totalUsers[0].count}`);

		// Check if users table exists and is accessible
		const tableExists = await sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_name = 'users'
			)
		`;

		if (tableExists[0].exists) {
			console.log('✅ Users table exists and is accessible');
		} else {
			console.log('❌ Users table does not exist - this is a critical issue!');
		}

		// 8. Provide actionable next steps
		console.log('\n8️⃣ Recommended Actions');
		console.log('=======================');

		if (!webhookSecret) {
			console.log('🔧 HIGH PRIORITY: Configure Clerk webhook secret');
			console.log('   Run: bun scripts/setup-clerk-webhook.ts\n');
		}

		if (totalUsers[0].count === 0) {
			console.log('📝 Try creating a test user manually:');
			console.log('   1. Go to your Clerk dashboard');
			console.log('   2. Create a new user');
			console.log('   3. Check if webhook event is received');
			console.log('   4. Run: bun scripts/validate-user-integrity.ts\n');
		}

		console.log('🔍 Monitor webhook activity:');
		console.log('   - Check server logs for webhook events');
		console.log('   - Use Clerk Dashboard webhook event logs');
		console.log('   - Run: bun scripts/test-clerk-webhook.ts\n');

		console.log('\n✅ User creation diagnostic completed');
	} catch (error) {
		console.error('\n❌ Error during diagnostic:', error);
		process.exit(1);
	}
};

fixUserCreation();
