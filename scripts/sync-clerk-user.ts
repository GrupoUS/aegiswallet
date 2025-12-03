import { getPoolClient } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Sync existing Clerk user to database
 *
 * Usage: bun scripts/sync-clerk-user.ts <clerk_user_id> <email> [full_name]
 *
 * Example: bun scripts/sync-clerk-user.ts user_2abc123 email@example.com "John Doe"
 */
async function syncClerkUser() {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.log('❌ Usage: bun scripts/sync-clerk-user.ts <clerk_user_id> <email> [full_name]');
		console.log('');
		console.log('Example:');
		console.log('  bun scripts/sync-clerk-user.ts user_2abc123 email@example.com "John Doe"');
		console.log('');
		console.log('To find your Clerk user ID:');
		console.log('1. Go to your Clerk Dashboard');
		console.log('2. Navigate to Users');
		console.log('3. Click on your user');
		console.log('4. Copy the User ID (format: user_xxx)');
		process.exit(1);
	}

	const [clerkUserId, email, fullName] = args;

	console.log('🔄 Syncing Clerk user to database...\n');
	console.log(`Clerk User ID: ${clerkUserId}`);
	console.log(`Email: ${email}`);
	console.log(`Full Name: ${fullName || '(not provided)'}`);

	const db = getPoolClient();

	try {
		// Check if user already exists
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, clerkUserId))
			.limit(1);

		if (existingUser) {
			console.log('\n✅ User already exists in database!');
			console.log(`ID: ${existingUser.id}`);
			console.log(`Email: ${existingUser.email}`);
			console.log(`Full Name: ${existingUser.fullName}`);
			console.log(`Created At: ${existingUser.createdAt}`);
			return;
		}

		// Insert user
		const [newUser] = await db.insert(users).values({
			id: clerkUserId,
			email: email,
			fullName: fullName || null,
		}).returning();

		console.log('\n✅ User created successfully!');
		console.log(`ID: ${newUser.id}`);
		console.log(`Email: ${newUser.email}`);
		console.log(`Full Name: ${newUser.fullName}`);
		console.log(`Created At: ${newUser.createdAt}`);

		console.log('\n🎉 You can now create bank accounts for this user!');

	} catch (error) {
		console.error('\n❌ Failed to sync user:', error);
		process.exit(1);
	}
}

syncClerkUser()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});
