/**
 * Test User Registration Flow
 *
 * Tests the complete user registration and bank account creation flow
 * to verify all fixes are working correctly:
 * 1. User creation via UserSyncService
 * 2. Organization creation
 * 3. Bank account creation
 * 4. RLS policies enforcement
 */

import { createClerkClient } from '@clerk/backend';
import { runAsServiceAccount, getPoolClient, closePool } from '../src/db/client';
import { UserSyncService } from '../src/services/user-sync.service';
import { users, bankAccounts } from '../src/db/schema';
import { organizations } from '../src/db/schema/organizations';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Test configuration
const TEST_USER = {
	email: 'test@example.com',
	firstName: 'Test',
	lastName: 'User',
};

const TEST_BANK_ACCOUNT = {
	institutionName: 'Banco do Brasil',
	institutionId: '001',
	accountNumber: '56789-0',
	accountType: 'CHECKING' as const,
	accountMask: '56789-0',
	belvoAccountId: 'test_belvo_123',
};

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

async function cleanupTestData() {
	console.log('\n🧹 Cleaning up test data...');

	try {
		// Delete test bank account
		await runAsServiceAccount(async (tx) => {
			await tx.delete(bankAccounts).where(eq(bankAccounts.belvoAccountId, TEST_BANK_ACCOUNT.belvoAccountId));
		});

		// Delete test organization
		await runAsServiceAccount(async (tx) => {
			await tx.delete(organizations).where(eq(organizations.email, TEST_USER.email));
		});

		// Delete test user from database
		await runAsServiceAccount(async (tx) => {
			await tx.delete(users).where(eq(users.email, TEST_USER.email));
		});

		// Delete test user from Clerk
		try {
			const { data: existingUsers } = await clerkClient.users.getUserList({
				limit: 1,
				query: TEST_USER.email,
			});

			if (existingUsers.length > 0) {
				await clerkClient.users.deleteUser(existingUsers[0].id);
				console.log('   ✅ Deleted test user from Clerk');
			}
		} catch (error) {
			console.log('   ⏭️  No Clerk user to delete');
		}

		console.log('   ✅ Test data cleaned up');
	} catch (error) {
		console.error('   ❌ Cleanup error:', error instanceof Error ? error.message : error);
	}
}

async function testUserCreation() {
	console.log('\n👤 STEP 1: Testing User Creation...');

	let clerkUser: any;

	try {
		// First try to create user in Clerk
		try {
			clerkUser = await clerkClient.users.createUser({
				emailAddress: [TEST_USER.email],
				firstName: TEST_USER.firstName,
				lastName: TEST_USER.lastName,
				password: 'TestPassword123!',
			});

			console.log(`   ✅ Created Clerk user: ${clerkUser.id}`);
		} catch (createError) {
			console.log(`   ⚠️  Failed to create Clerk user: ${createError instanceof Error ? createError.message : createError}`);
			console.log('   🔄 Trying to use existing test user...');

			// Try to find existing test user
			const { data: existingUsers } = await clerkClient.users.getUserList({
				limit: 1,
				query: 'test@example.com',
			});

			if (existingUsers.length === 0) {
				throw new Error('No existing test user found and cannot create new one');
			}

			clerkUser = existingUsers[0];
			console.log(`   ✅ Using existing Clerk user: ${clerkUser.id}`);
		}

		// Test UserSyncService.ensureUserExists
		const dbUser = await UserSyncService.ensureUserExists(clerkUser.id);

		console.log(`   ✅ UserSyncService created user:`);
		console.log(`      ID: ${dbUser.id}`);
		console.log(`      Email: ${dbUser.email}`);
		console.log(`      Organization: ${dbUser.organizationId}`);

		// Verify user in database
		const client = await getPoolClient();
		const [verifyUser] = await client.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);

		if (!verifyUser) {
			throw new Error('User not found in database after creation');
		}

		console.log('   ✅ User verified in database');

		// Check if organization was created
		if (verifyUser.organizationId && verifyUser.organizationId !== 'default') {
			const [verifyOrg] = await client
				.select()
				.from(organizations)
				.where(eq(organizations.id, verifyUser.organizationId))
				.limit(1);

			if (verifyOrg) {
				console.log(`   ✅ Organization created: ${verifyOrg.name} (${verifyOrg.id})`);
			} else {
				console.log('   ⚠️  Organization ID set but organization not found');
			}
		} else {
			console.log('   ⚠️  User has default organization (organization creation may have failed)');
		}

		return clerkUser.id;
	} catch (error) {
		console.error('   ❌ User creation failed:', error instanceof Error ? error.message : error);
		throw error;
	}
}

async function testBankAccountCreation(userId: string) {
	console.log('\n🏦 STEP 2: Testing Bank Account Creation...');

	try {
		// Test creating bank account directly in database (simulating API call)
		const [bankAccount] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(bankAccounts)
				.values({
					...TEST_BANK_ACCOUNT,
					userId,
					id: crypto.randomUUID(),
				})
				.returning();
		});

		console.log(`   ✅ Bank account created:`);
		console.log(`      ID: ${bankAccount.id}`);
		console.log(`      Bank: ${bankAccount.institutionName}`);
		console.log(`      User: ${bankAccount.userId}`);

		// Verify RLS is working - try to access with user context
		const userClient = await getPoolClient();
		await userClient.execute(sql`SELECT set_config('app.current_user_id', ${userId}, false)`);

		const [userAccessibleAccount] = await userClient
			.select()
			.from(bankAccounts)
			.where(eq(bankAccounts.id, bankAccount.id))
			.limit(1);

		if (!userAccessibleAccount) {
			console.log('   ❌ RLS Issue: User cannot access their own bank account');
		} else {
			console.log('   ✅ RLS Working: User can access their bank account');
		}

		// Test another user cannot access this account
		await userClient.execute(sql`SELECT set_config('app.current_user_id', 'user_other_user', false)`);

		const [otherUserAccess] = await userClient
			.select()
			.from(bankAccounts)
			.where(eq(bankAccounts.id, bankAccount.id))
			.limit(1);

		if (otherUserAccess) {
			console.log('   ❌ RLS Issue: Other user can access bank account');
		} else {
			console.log('   ✅ RLS Working: Other user cannot access bank account');
		}

		return bankAccount.id;
	} catch (error) {
		console.error('   ❌ Bank account creation failed:', error instanceof Error ? error.message : error);
		throw error;
	}
}

async function testServiceAccountBypass() {
	console.log('\n🔧 STEP 3: Testing Service Account Bypass...');

	try {
		// Service account should be able to access any data
		const allAccounts = await runAsServiceAccount(async (tx) => {
			return tx.select().from(bankAccounts);
		});

		console.log(`   ✅ Service account can access ${allAccounts.length} bank accounts`);

		// Try to create bank account as service account
		const [newAccount] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(bankAccounts)
				.values({
					...TEST_BANK_ACCOUNT,
					belvoAccountId: 'service_account_test',
					userId: 'service_account_test',
					id: crypto.randomUUID(),
				})
				.returning();
		});

		console.log(`   ✅ Service account created bank account: ${newAccount.id}`);

		// Clean up service account test data
		await runAsServiceAccount(async (tx) => {
			await tx.delete(bankAccounts).where(eq(bankAccounts.id, newAccount.id));
		});

		console.log('   ✅ Service account bypass working correctly');
	} catch (error) {
		console.error('   ❌ Service account bypass failed:', error instanceof Error ? error.message : error);
		throw error;
	}
}

async function main() {
	console.log('═══════════════════════════════════════════════════════════════');
	console.log('   🧪 USER REGISTRATION FLOW TEST');
	console.log('═══════════════════════════════════════════════════════════════');

	let userId: string | null = null;
	let bankAccountId: string | null = null;

	try {
		// Clean up any existing test data
		await cleanupTestData();

		// Test 1: User creation
		userId = await testUserCreation();

		// Test 2: Bank account creation
		if (userId) {
			bankAccountId = await testBankAccountCreation(userId);
		}

		// Test 3: Service account bypass
		await testServiceAccountBypass();

		console.log('\n═══════════════════════════════════════════════════════════════');
		console.log('   ✅ ALL TESTS PASSED - Registration flow working!');
		console.log('═══════════════════════════════════════════════════════════════');

	} catch (error) {
		console.error('\n═══════════════════════════════════════════════════════════════');
		console.error('   ❌ TEST FAILED - Registration flow has issues');
		console.error('═══════════════════════════════════════════════════════════════');
		console.error('Error:', error instanceof Error ? error.message : error);

		// Print stack trace for debugging
		if (error instanceof Error && error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
	} finally {
		// Clean up test data regardless of test outcome
		if (userId || bankAccountId) {
			await cleanupTestData();
		}

		await closePool();
	}
}

// Run the test
main().catch(console.error);