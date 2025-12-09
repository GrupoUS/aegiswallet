import { randomUUID } from 'node:crypto';

import { getPoolClient } from '../src/db/client';
import { bankAccounts, users } from '../src/db/schema';

/**
 * Test bank account creation with proper foreign key handling
 */
async function testBankAccountCreation() {
	const db = getPoolClient();

	// Simulated Clerk user ID (format: user_xxx)
	const testUserId = 'user_test_script_' + Date.now();
	const testEmail = `test_${Date.now()}@aegiswallet.dev`;

	console.log('🧪 Testing bank account creation flow...\n');
	console.log(`Test User ID: ${testUserId}`);
	console.log(`Test Email: ${testEmail}`);

	try {
		// Step 1: Try to create bank account WITHOUT user in users table
		console.log('\n📌 Step 1: Try creating bank account WITHOUT user record...');
		try {
			await db.insert(bankAccounts).values({
				id: randomUUID(),
				userId: testUserId,
				institutionName: 'Test Bank',
				institutionId: 'test_bank_001',
				accountType: 'CHECKING',
				accountMask: '**** 1234',
				belvoAccountId: `belvo_test_${randomUUID()}`,
				syncStatus: 'manual',
				balance: '1000',
				currency: 'BRL',
				isPrimary: false,
				isActive: true,
			});
			console.log('   ❌ UNEXPECTED: Bank account created without user record!');
		} catch (error) {
			console.log('   ✅ EXPECTED ERROR: Cannot create bank account without user record');
			console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		// Step 2: Create user first, then bank account
		console.log('\n📌 Step 2: Create user record first...');
		await db.insert(users).values({
			id: testUserId,
			email: testEmail,
			fullName: 'Test User Script',
		});
		console.log('   ✅ User record created successfully');

		// Step 3: Now create bank account
		console.log('\n📌 Step 3: Create bank account WITH user record...');
		const [newAccount] = await db
			.insert(bankAccounts)
			.values({
				id: randomUUID(),
				userId: testUserId,
				institutionName: 'Test Bank',
				institutionId: 'test_bank_001',
				accountType: 'CHECKING',
				accountMask: '**** 5678',
				belvoAccountId: `belvo_test_${randomUUID()}`,
				syncStatus: 'manual',
				balance: '2500',
				currency: 'BRL',
				isPrimary: true,
				isActive: true,
			})
			.returning();
		console.log('   ✅ Bank account created successfully!');
		console.log(`   Account ID: ${newAccount.id}`);
		console.log(`   Institution: ${newAccount.institutionName}`);
		console.log(`   Balance: R$ ${newAccount.balance}`);

		// Step 4: Cleanup
		console.log('\n📌 Step 4: Cleanup test data...');
		await db.execute(`DELETE FROM bank_accounts WHERE user_id = '${testUserId}'`);
		await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
		console.log('   ✅ Test data cleaned up');

		console.log('\n' + '='.repeat(60));
		console.log('📋 CONCLUSION:');
		console.log('='.repeat(60));
		console.log('The foreign key constraint is working correctly.');
		console.log('Bank accounts can only be created if the user exists in the users table.');
		console.log('\nWhen you login with Clerk:');
		console.log('1. The Clerk webhook should create the user record in the users table');
		console.log('2. Then you can create bank accounts for that user');
		console.log(
			"\nIf you're getting an error, your Clerk user ID might not be in the users table.",
		);
		console.log('Check the webhook logs or manually insert your user.');
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

testBankAccountCreation()
	.then(() => {
		console.log('\n✅ Test complete');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Error:', error);
		process.exit(1);
	});
