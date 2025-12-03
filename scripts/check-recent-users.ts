/**
 * Check recent users to see if webhooks are being processed
 */

import { neon } from '@neondatabase/serverless';

const checkRecentUsers = async () => {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	const sql = neon(databaseUrl);

	console.log('\n👥 Checking Recent Users');
	console.log('======================\n');

	try {
		// Get all users ordered by creation date
		const users = await sql`
			SELECT 
				id,
				email,
				full_name,
				phone,
				created_at,
				updated_at
			FROM users
			ORDER BY created_at DESC
			LIMIT 10
		`;

		if (users.length === 0) {
			console.log('ℹ️  No users found in database');
			console.log('\nThis could mean:');
			console.log('- Webhooks are not being received');
			console.log('- Webhook processing is failing');
			console.log('- Database connection issues');
		} else {
			console.log(`Found ${users.length} users:\n`);

			users.forEach((user, index) => {
				const date = new Date(user.created_at);
				const now = new Date();
				const hoursAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
				
				console.log(`${index + 1}. ${user.email}`);
				console.log(`   Name: ${user.full_name || 'Not set'}`);
				console.log(`   Phone: ${user.phone || 'Not set'}`);
				console.log(`   Created: ${date.toLocaleString()} (${hoursAgo} hours ago)`);
				console.log(`   ID: ${user.id}\n`);
			});

			// Check for very recent users (last 1 hour)
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const recentUsers = users.filter((user) => new Date(user.created_at) > oneHourAgo);

			if (recentUsers.length > 0) {
				console.log('✅ Recent activity detected!');
				console.log(`${recentUsers.length} user(s) created in the last hour`);
			} else {
				console.log('⚠️  No users created in the last hour');
			}
		}

		// Check server logs for webhook errors (if we could)
		console.log('\n📊 Webhook Health Check:');
		console.log('========================');
		
		console.log('✅ Database connection successful');
		console.log('✅ User table accessible');
		
		// Test if we can insert a user manually
		const testId = `test_${Date.now()}`;
		try {
			await sql`
				INSERT INTO users (id, email, created_at, updated_at)
				VALUES (${testId}, 'manual-test@example.com', NOW(), NOW())
				ON CONFLICT (id) DO NOTHING
			`;
			console.log('✅ Manual user insert successful');
			
			// Clean up
			await sql`DELETE FROM users WHERE id = ${testId}`;
			console.log('✅ Test record cleaned up');
		} catch (error) {
			console.error('❌ Manual user insert failed:', error);
		}

	} catch (error) {
		console.error('❌ Error checking users:', error);
	}
};

checkRecentUsers();
