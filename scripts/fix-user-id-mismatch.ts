/**
 * Fix User ID Mismatch
 * Updates user ID in database to match Clerk user ID
 */

import { eq, sql } from 'drizzle-orm';

import { closePool, getPoolClient, runAsServiceAccount } from '../src/db/client';
import { users } from '../src/db/schema';

async function fixUserIdMismatch() {
	const oldUserId = 'user_365eNZQx0xQcmSHO4Xi3ynlPmkc';
	const newUserId = 'user_36L9ErlxQaogXxLrSMmGuIRGX2k';
	const email = 'msm.jur@gmail.com';

	console.log('🔄 Fixing User ID Mismatch...');
	console.log(`   Old ID: ${oldUserId}`);
	console.log(`   New ID: ${newUserId}`);
	console.log(`   Email: ${email}\n`);

	try {
		await runAsServiceAccount(async (tx) => {
			// Check current user
			const [currentUser] = await tx.select().from(users).where(eq(users.email, email));
			if (!currentUser) {
				console.log('❌ User not found with this email');
				return;
			}
			console.log(`   Current user ID: ${currentUser.id}`);

			if (currentUser.id === newUserId) {
				console.log('✅ User ID already correct!');
				return;
			}

			// Use raw SQL to update with CASCADE-like behavior
			// First, disable FK checks temporarily by updating in the right order

			// 1. Update bank_accounts FK
			const bankResult = await tx.execute(
				sql`UPDATE bank_accounts SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			console.log(`   Updated bank_accounts`);

			// 2. Update subscriptions FK
			const subResult = await tx.execute(
				sql`UPDATE subscriptions SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			console.log(`   Updated subscriptions`);

			// 3. Update transactions FK
			const txResult = await tx.execute(
				sql`UPDATE transactions SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			console.log(`   Updated transactions`);

			// 4. Update any other tables with user_id FK
			await tx.execute(
				sql`UPDATE transaction_categories SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE notifications SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE user_preferences SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE user_security SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE chat_sessions SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE voice_commands SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE lgpd_consents SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			await tx.execute(
				sql`UPDATE audit_logs SET user_id = ${newUserId} WHERE user_id = ${oldUserId}`,
			);
			console.log(`   Updated other related tables`);

			// 5. Finally update the user ID itself
			const userResult = await tx.execute(
				sql`UPDATE users SET id = ${newUserId} WHERE id = ${oldUserId}`,
			);
			console.log(`   Updated user ID`);

			console.log('\n✅ User ID mismatch fixed!');
		});
	} catch (error) {
		console.error('❌ Error fixing user ID:', error instanceof Error ? error.message : error);
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
	} finally {
		await closePool();
	}
}

fixUserIdMismatch();
