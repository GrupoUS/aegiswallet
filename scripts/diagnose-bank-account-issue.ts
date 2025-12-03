#!/usr/bin/env bun
/**
 * Bank Account Creation Issue Diagnostic Script
 *
 * Diagnoses the 500 error when creating bank accounts by:
 * 1. Inspecting Clerk users
 * 2. Checking Neon database user records
 * 3. Verifying RLS policies
 * 4. Testing database operations
 */

import { createClerkClient } from '@clerk/backend';
import { eq, sql } from 'drizzle-orm';
import { getPoolClient } from '../src/db/client';
import { bankAccounts } from '../src/db/schema/bank-accounts';
import { users } from '../src/db/schema/users';
import { secureLogger } from '../src/lib/logging/secure-logger';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
	console.error('❌ CLERK_SECRET_KEY environment variable is not set');
	process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

/**
 * Inspect Clerk users
 */
async function inspectClerkUsers() {
	console.log('\n' + '='.repeat(60));
	console.log('📋 PHASE 1: INSPECTING CLERK USERS');
	console.log('='.repeat(60));

	try {
		const response = await clerkClient.users.getUserList({ limit: 10 });
		const clerkUsers = response.data;

		console.log(`\n✅ Found ${clerkUsers.length} users in Clerk\n`);

		for (const user of clerkUsers) {
			const email = user.emailAddresses[0]?.emailAddress || '(no email)';
			const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '(no name)';

			console.log(`👤 User: ${user.id}`);
			console.log(`   Email: ${email}`);
			console.log(`   Name: ${name}`);
			console.log(`   Created: ${new Date(user.createdAt).toISOString()}`);
			console.log(`   Last Sign In: ${user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : 'Never'}`);
			console.log(`   Organization ID: ${user.publicMetadata?.organizationId || '(not set)'}`);
			console.log(`   Stripe Customer ID: ${user.privateMetadata?.stripeCustomerId || '(not set)'}`);
			console.log('');
		}

		return clerkUsers;
	} catch (error) {
		console.error('❌ Failed to fetch Clerk users:', error);
		throw error;
	}
}

/**
 * Inspect Neon database users
 */
async function inspectNeonDatabase() {
	console.log('\n' + '='.repeat(60));
	console.log('📋 PHASE 2: INSPECTING NEON DATABASE');
	console.log('='.repeat(60));

	const db = getPoolClient();

	try {
		// Check users table
		const dbUsers = await db.select().from(users);
		console.log(`\n✅ Found ${dbUsers.length} users in database\n`);

		for (const user of dbUsers) {
			console.log(`👤 User: ${user.id}`);
			console.log(`   Email: ${user.email}`);
			console.log(`   Name: ${user.fullName || '(no name)'}`);
			console.log(`   Organization ID: ${user.organizationId}`);
			console.log(`   Created: ${user.createdAt?.toISOString() || '(unknown)'}`);
			console.log('');
		}

		// Check bank_accounts table structure
		console.log('\n📊 Checking bank_accounts table structure...');
		const tableInfo = await db.execute(sql`
			SELECT
				column_name,
				data_type,
				is_nullable,
				column_default
			FROM information_schema.columns
			WHERE table_name = 'bank_accounts'
			ORDER BY ordinal_position;
		`);

		console.log('\nBank Accounts Table Structure:');
		for (const col of tableInfo.rows as Array<{
			column_name: string;
			data_type: string;
			is_nullable: string;
			column_default: string | null;
		}>) {
			console.log(
				`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`,
			);
		}

		// Check RLS policies
		console.log('\n🔐 Checking RLS policies...');
		const rlsStatus = await db.execute(sql`
			SELECT
				tablename,
				rowsecurity
			FROM pg_tables
			WHERE schemaname = 'public'
			AND tablename IN ('users', 'bank_accounts');
		`);

		console.log('\nRLS Status:');
		for (const row of rlsStatus.rows as Array<{ tablename: string; rowsecurity: boolean }>) {
			console.log(`   ${row.tablename}: RLS ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
		}

		// Check RLS policies
		const policies = await db.execute(sql`
			SELECT
				schemaname,
				tablename,
				policyname,
				permissive,
				roles,
				cmd,
				qual,
				with_check
			FROM pg_policies
			WHERE tablename = 'bank_accounts';
		`);

		console.log('\nRLS Policies on bank_accounts:');
		if (policies.rows.length === 0) {
			console.log('   ⚠️  No RLS policies found!');
		} else {
			for (const policy of policies.rows as Array<{
				policyname: string;
				cmd: string;
				qual: string | null;
			}>) {
				console.log(`   Policy: ${policy.policyname}`);
				console.log(`   Command: ${policy.cmd}`);
				console.log(`   Using: ${policy.qual || '(none)'}`);
				console.log('');
			}
		}

		// Check foreign key constraints
		console.log('\n🔗 Checking foreign key constraints...');
		const fkConstraints = await db.execute(sql`
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
			AND tc.table_name = 'bank_accounts';
		`);

		console.log('\nForeign Key Constraints:');
		if (fkConstraints.rows.length === 0) {
			console.log('   ⚠️  No foreign key constraints found!');
		} else {
			for (const fk of fkConstraints.rows as Array<{
				constraint_name: string;
				column_name: string;
				foreign_table_name: string;
				foreign_column_name: string;
			}>) {
				console.log(
					`   ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (${fk.constraint_name})`,
				);
			}
		}

		// Check existing bank accounts
		const existingAccounts = await db.select().from(bankAccounts).limit(5);
		console.log(`\n📊 Found ${existingAccounts.length} bank accounts in database`);
		if (existingAccounts.length > 0) {
			console.log('\nSample bank accounts:');
			for (const account of existingAccounts) {
				console.log(`   ID: ${account.id}`);
				console.log(`   User ID: ${account.userId}`);
				console.log(`   Institution: ${account.institutionName}`);
				console.log(`   Balance: ${account.balance}`);
				console.log('');
			}
		}

		return { dbUsers, existingAccounts };
	} catch (error) {
		console.error('❌ Failed to inspect database:', error);
		throw error;
	}
}

/**
 * Test RLS context setting
 */
async function testRLSContext() {
	console.log('\n' + '='.repeat(60));
	console.log('📋 PHASE 3: TESTING RLS CONTEXT');
	console.log('='.repeat(60));

	const db = getPoolClient();

	try {
		// Test setting RLS context
		const testUserId = 'user_test_rls_context';
		console.log(`\n🧪 Testing RLS context with user ID: ${testUserId}`);

		// Try to set context
		await db.execute(sql`SET LOCAL app.current_user_id = ${testUserId}`);

		// Verify context is set
		const contextCheck = await db.execute(
			sql`SELECT current_setting('app.current_user_id', true) as user_id`,
		);
		const currentUserId = (contextCheck.rows[0] as { user_id: string | null })?.user_id;

		if (currentUserId === testUserId) {
			console.log('✅ RLS context can be set successfully');
		} else {
			console.log(`⚠️  RLS context not set correctly. Expected: ${testUserId}, Got: ${currentUserId}`);
		}

		// Test query with context
		console.log('\n🧪 Testing query with RLS context...');
		try {
			const testQuery = await db.execute(
				sql`SELECT COUNT(*) as count FROM bank_accounts WHERE user_id = current_setting('app.current_user_id', true)`,
			);
			console.log(`✅ Query executed successfully. Count: ${(testQuery.rows[0] as { count: string })?.count}`);
		} catch (queryError) {
			console.error('❌ Query failed:', queryError);
		}
	} catch (error) {
		console.error('❌ Failed to test RLS context:', error);
		throw error;
	}
}

/**
 * Compare Clerk users with database users
 */
async function compareUsers(clerkUsers: any[], dbUsers: any[]) {
	console.log('\n' + '='.repeat(60));
	console.log('📋 PHASE 4: COMPARING CLERK VS DATABASE USERS');
	console.log('='.repeat(60));

	const clerkUserIds = new Set(clerkUsers.map((u) => u.id));
	const dbUserIds = new Set(dbUsers.map((u) => u.id));

	const missingInDb = clerkUsers.filter((u) => !dbUserIds.has(u.id));
	const missingInClerk = dbUsers.filter((u) => !clerkUserIds.has(u.id));

	console.log(`\n📊 Summary:`);
	console.log(`   Clerk users: ${clerkUsers.length}`);
	console.log(`   Database users: ${dbUsers.length}`);
	console.log(`   Missing in database: ${missingInDb.length}`);
	console.log(`   Missing in Clerk: ${missingInClerk.length}`);

	if (missingInDb.length > 0) {
		console.log('\n⚠️  Users in Clerk but NOT in database:');
		for (const user of missingInDb) {
			const email = user.emailAddresses[0]?.emailAddress || '(no email)';
			console.log(`   - ${user.id} (${email})`);
		}
	}

	if (missingInClerk.length > 0) {
		console.log('\n⚠️  Users in database but NOT in Clerk:');
		for (const user of missingInClerk) {
			console.log(`   - ${user.id} (${user.email})`);
		}
	}
}

/**
 * Main diagnostic function
 */
async function main() {
	console.log('🔍 Bank Account Creation Issue Diagnostic');
	console.log('='.repeat(60));

	try {
		// Phase 1: Inspect Clerk users
		const clerkUsers = await inspectClerkUsers();

		// Phase 2: Inspect Neon database
		const { dbUsers } = await inspectNeonDatabase();

		// Phase 3: Test RLS context
		await testRLSContext();

		// Phase 4: Compare users
		await compareUsers(clerkUsers, dbUsers);

		console.log('\n' + '='.repeat(60));
		console.log('✅ DIAGNOSTIC COMPLETE');
		console.log('='.repeat(60));
	} catch (error) {
		console.error('\n❌ Diagnostic failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

