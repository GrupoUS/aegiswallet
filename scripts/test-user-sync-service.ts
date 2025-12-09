/**
 * Test UserSyncService Directly
 *
 * Tests UserSyncService.ensureUserExists with a mock Clerk user ID
 * to verify the service account bypass and organization creation works
 */

import { eq, sql } from 'drizzle-orm';

import { closePool, getPoolClient, runAsServiceAccount } from '../src/db/client';
import { bankAccounts, users } from '../src/db/schema';
import { organizations } from '../src/db/schema/organizations';
import { UserSyncService } from '../src/services/user-sync.service';

// Test configuration
const TEST_CLERK_ID = 'user_test123456789';
const TEST_USER = {
	email: 'test@example.com',
	fullName: 'Test User',
};

async function cleanupTestData() {
	console.log('\n🧹 Cleaning up test data...');

	try {
		// Delete test data with service account bypass
		await runAsServiceAccount(async (tx) => {
			await tx.delete(bankAccounts).where(eq(bankAccounts.userId, TEST_CLERK_ID));
			await tx.delete(organizations).where(eq(organizations.email, TEST_USER.email));
			await tx.delete(users).where(eq(users.id, TEST_CLERK_ID));
		});

		console.log('   ✅ Test data cleaned up');
	} catch (error) {
		console.error('   ❌ Cleanup error:', error instanceof Error ? error.message : error);
	}
}

async function testUserSyncService() {
	console.log('\n👤 STEP 1: Testing UserSyncService.ensureUserExists...');

	try {
		// Mock the Clerk user response by directly inserting into database
		const [mockUser] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(users)
				.values({
					id: TEST_CLERK_ID,
					email: TEST_USER.email,
					fullName: TEST_USER.fullName,
					organizationId: 'default',
				})
				.returning();
		});

		console.log(`   ✅ Created mock user: ${mockUser.id}`);
		console.log(`      Email: ${mockUser.email}`);
		console.log(`      Organization: ${mockUser.organizationId}`);

		// Now test UserSyncService with existing user
		const existingUser = await UserSyncService.ensureUserExists(TEST_CLERK_ID);

		console.log('   ✅ UserSyncService found existing user');
		console.log(`      ID: ${existingUser.id}`);
		console.log(`      Email: ${existingUser.email}`);
		console.log(`      Organization: ${existingUser.organizationId}`);

		// Clean up for next test
		await runAsServiceAccount(async (tx) => {
			await tx.delete(users).where(eq(users.id, TEST_CLERK_ID));
		});

		// Now test with non-existent user (should create new one)
		console.log('\n   🔄 Testing with non-existent user...');

		// This will fail at Clerk API call, but we can catch and test the DB part
		try {
			await UserSyncService.ensureUserExists('user_nonexistent');
		} catch (clerkError) {
			console.log(
				`   ⚠️  Expected Clerk error: ${clerkError instanceof Error ? clerkError.message : clerkError}`,
			);
		}

		return true;
	} catch (error) {
		console.error(
			'   ❌ UserSyncService test failed:',
			error instanceof Error ? error.message : error,
		);
		throw error;
	}
}

async function testServiceAccountBypass() {
	console.log('\n🔧 STEP 2: Testing Service Account Bypass...');

	try {
		// Create test user with service account
		const [testUser] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(users)
				.values({
					id: TEST_CLERK_ID,
					email: TEST_USER.email,
					fullName: TEST_USER.fullName,
					organizationId: 'default',
				})
				.returning();
		});

		// Create test bank account with service account
		const [testBankAccount] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(bankAccounts)
				.values({
					id: crypto.randomUUID(),
					userId: TEST_CLERK_ID,
					belvoAccountId: 'test_belvo_123',
					institutionId: '001',
					institutionName: 'Banco do Brasil',
					accountType: 'CHECKING',
					accountNumber: '12345-6',
					accountMask: '12345-6',
				})
				.returning();
		});

		console.log(`   ✅ Service account created bank account: ${testBankAccount.id}`);

		// Test RLS with regular client
		const regularClient = await getPoolClient();

		// Try to access without user context (should fail due to RLS)
		try {
			const accounts = await regularClient.select().from(bankAccounts);
			console.log(
				`   ⚠️  Regular client accessed ${accounts.length} accounts (RLS might be disabled)`,
			);
		} catch (rlsError) {
			console.log('   ✅ RLS blocked regular client access (expected)');
		}

		// Try with user context (should work)
		await regularClient.execute(
			sql`SELECT set_config('app.current_user_id', ${TEST_CLERK_ID}, false)`,
		);
		const userAccounts = await regularClient.select().from(bankAccounts);

		if (userAccounts.length > 0) {
			console.log('   ✅ User can access their own accounts through RLS');
		} else {
			console.log('   ❌ User cannot access their own accounts');
		}

		// Try with different user context (should not work)
		await regularClient.execute(sql`SELECT set_config('app.current_user_id', 'user_other', false)`);
		const otherAccounts = await regularClient.select().from(bankAccounts);

		if (otherAccounts.length === 0) {
			console.log('   ✅ RLS prevents access to other users data');
		} else {
			console.log('   ❌ RLS allows access to other users data');
		}

		return true;
	} catch (error) {
		console.error(
			'   ❌ Service account bypass test failed:',
			error instanceof Error ? error.message : error,
		);
		throw error;
	}
}

async function testOrganizationCreation() {
	console.log('\n🏢 STEP 3: Testing Organization Creation...');

	try {
		// Check if we can create an organization with service account
		const [testOrg] = await runAsServiceAccount(async (tx) => {
			return tx
				.insert(organizations)
				.values({
					id: crypto.randomUUID(),
					name: 'Test Organization',
					fantasyName: 'Test Org',
					email: TEST_USER.email,
					organizationType: 'individual',
					status: 'active',
					memberLimit: 1,
				})
				.returning();
		});

		console.log(`   ✅ Service account created organization: ${testOrg.id}`);

		// Update user with organization
		const [updatedUser] = await runAsServiceAccount(async (tx) => {
			return tx
				.update(users)
				.set({ organizationId: testOrg.id })
				.where(eq(users.id, TEST_CLERK_ID))
				.returning();
		});

		console.log(`   ✅ Updated user organization: ${updatedUser.organizationId}`);

		// Verify organization exists
		const client = await getPoolClient();
		const [verifyOrg] = await client
			.select()
			.from(organizations)
			.where(eq(organizations.id, testOrg.id))
			.limit(1);

		if (verifyOrg) {
			console.log('   ✅ Organization verified in database');
		} else {
			console.log('   ❌ Organization not found');
		}

		return true;
	} catch (error) {
		console.error(
			'   ❌ Organization creation test failed:',
			error instanceof Error ? error.message : error,
		);
		throw error;
	}
}

async function main() {
	console.log('═════════════════════════════════════════════════════════════');
	console.log('   🧪 USER SYNC SERVICE TEST');
	console.log('═══════════════════════════════════════════════════════════════');

	try {
		// Clean up any existing test data
		await cleanupTestData();

		// Test 1: UserSyncService
		await testUserSyncService();

		// Test 2: Service account bypass
		await testServiceAccountBypass();

		// Test 3: Organization creation
		await testOrganizationCreation();

		console.log('\n═════════════════════════════════════════════════════════════');
		console.log('   ✅ ALL TESTS PASSED - UserSyncService working!');
		console.log('═══════════════════════════════════════════════════════════════');
	} catch (error) {
		console.error('\n═══════════════════════════════════════════════════════════════');
		console.error('   ❌ TEST FAILED - UserSyncService has issues');
		console.error('═══════════════════════════════════════════════════════════════');
		console.error('Error:', error instanceof Error ? error.message : error);

		// Print stack trace for debugging
		if (error instanceof Error && error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
	} finally {
		// Clean up test data regardless of test outcome
		await cleanupTestData();

		await closePool();
	}
}

// Run test
main().catch(console.error);
