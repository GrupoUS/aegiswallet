#!/usr/bin/env tsx

/**
 * Neon DB Verification Script
 *
 * Verifies database connection, schema integrity, RLS policies, and identifies orphaned data
 */

import { sql } from 'drizzle-orm';

import { getPoolClient } from '../src/db/client';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Verify database connection
 */
async function verifyConnection() {
	console.log('🔌 Verifying database connection...');

	if (!DATABASE_URL) {
		console.log('❌ DATABASE_URL environment variable is not set');
		return false;
	}

	try {
		const db = getPoolClient();
		await db.execute(sql`SELECT 1`);
		console.log('✅ Database connection successful');
		return true;
	} catch (error) {
		console.log(
			`❌ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

/**
 * Validate schema structure
 */
async function validateSchema() {
	console.log('\n📋 Validating schema structure...');

	const db = getPoolClient();
	const issues: string[] = [];

	try {
		// Check critical tables
		const criticalTables = [
			{ name: 'users', requiredColumns: ['id', 'email', 'organization_id'] },
			{ name: 'organizations', requiredColumns: ['id', 'name'] },
			{ name: 'subscriptions', requiredColumns: ['id', 'user_id', 'stripe_customer_id'] },
			{ name: 'organization_members', requiredColumns: ['id', 'organization_id', 'user_id'] },
		];

		for (const table of criticalTables) {
			const result = await db.execute(sql`
				SELECT column_name
				FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = ${table.name};
			`);

			// Handle Neon response format (array or object)
			const resultArray = Array.isArray(result) ? result : result.rows || [result] || [];
			const existingColumns = resultArray.map((r: any) => r.column_name || r.column_name);
			const missingColumns = table.requiredColumns.filter((col) => !existingColumns.includes(col));

			if (missingColumns.length > 0) {
				issues.push(`Table '${table.name}' missing columns: ${missingColumns.join(', ')}`);
				console.log(`   ❌ ${table.name}: Missing columns`);
			} else {
				console.log(`   ✅ ${table.name}: All required columns present`);
			}
		}

		// Check constraints
		const constraintsResult = await db.execute(sql`
			SELECT
				tc.table_name,
				tc.constraint_name,
				tc.constraint_type
			FROM information_schema.table_constraints tc
			WHERE tc.table_schema = 'public'
			AND tc.table_name IN ('users', 'organizations', 'subscriptions')
			ORDER BY tc.table_name, tc.constraint_type;
		`);

		const constraintsArray = Array.isArray(constraintsResult)
			? constraintsResult
			: constraintsResult.rows || [constraintsResult] || [];
		console.log(`   📊 Found ${constraintsArray.length} constraints`);

		// Check for NOT NULL constraints on critical columns
		const notNullResult = await db.execute(sql`
			SELECT
				table_name,
				column_name
			FROM information_schema.columns
			WHERE table_schema = 'public'
			AND is_nullable = 'NO'
			AND table_name IN ('users', 'organizations', 'subscriptions')
			AND column_name IN ('id', 'email', 'organization_id', 'user_id');
		`);

		const notNullArray = Array.isArray(notNullResult)
			? notNullResult
			: notNullResult.rows || [notNullResult] || [];
		console.log(`   ✅ ${notNullArray.length} critical columns have NOT NULL constraints`);

		if (issues.length > 0) {
			console.log('\n⚠️  Schema issues found:');
			for (const issue of issues) {
				console.log(`   - ${issue}`);
			}
			return false;
		}

		console.log('\n✅ Schema validation passed');
		return true;
	} catch (error) {
		console.log(
			`❌ Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

/**
 * Verify RLS policies
 */
async function verifyRLSPolicies() {
	console.log('\n🔒 Verifying RLS policies...');

	const db = getPoolClient();

	try {
		// Check if RLS is enabled on critical tables
		const rlsTablesResult = await db.execute(sql`
			SELECT
				schemaname,
				tablename,
				rowsecurity
			FROM pg_tables
			WHERE schemaname = 'public'
			AND tablename IN ('users', 'organizations', 'transactions', 'bank_accounts');
		`);

		const rlsTables = Array.isArray(rlsTablesResult)
			? rlsTablesResult
			: rlsTablesResult.rows || [rlsTablesResult] || [];
		let rlsEnabledCount = 0;
		for (const table of rlsTables) {
			if (table.rowsecurity) {
				rlsEnabledCount++;
				console.log(`   ✅ RLS enabled on '${table.tablename}'`);
			} else {
				console.log(`   ⚠️  RLS not enabled on '${table.tablename}'`);
			}
		}

		// Check for RLS policies
		const policiesResult = await db.execute(sql`
			SELECT
				schemaname,
				tablename,
				policyname
			FROM pg_policies
			WHERE schemaname = 'public'
			AND tablename IN ('users', 'organizations', 'transactions', 'bank_accounts');
		`);

		const policies = Array.isArray(policiesResult)
			? policiesResult
			: policiesResult.rows || [policiesResult] || [];
		console.log(`   📊 Found ${policies.length} RLS policies`);

		if (rlsEnabledCount === rlsTables.length && policies.length > 0) {
			console.log('\n✅ RLS policies verified');
			return true;
		}
		console.log('\n⚠️  Some tables may not have RLS enabled or policies configured');
		return false;
	} catch (error) {
		console.log(
			`❌ RLS verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

/**
 * Identify orphaned data
 */
async function identifyOrphanedData() {
	console.log('\n🔍 Identifying orphaned data...');

	const db = getPoolClient();
	const issues: string[] = [];

	try {
		// Users without organization (except default)
		const usersWithoutOrgResult = await db.execute(sql`
			SELECT COUNT(*) as count
			FROM users
			WHERE organization_id IS NULL
			OR organization_id = 'default';
		`);

		const usersWithoutOrgArray = Array.isArray(usersWithoutOrgResult)
			? usersWithoutOrgResult
			: usersWithoutOrgResult.rows || [usersWithoutOrgResult] || [];
		const orphanedUsers = Number(usersWithoutOrgArray[0]?.count || 0);
		if (orphanedUsers > 0) {
			issues.push(`${orphanedUsers} users without valid organization`);
			console.log(`   ⚠️  Found ${orphanedUsers} users without valid organization`);
		} else {
			console.log(`   ✅ All users have valid organizations`);
		}

		// Organization members without organization
		const membersWithoutOrgResult = await db.execute(sql`
			SELECT COUNT(*) as count
			FROM organization_members om
			LEFT JOIN organizations o ON om.organization_id = o.id
			WHERE o.id IS NULL;
		`);

		const membersWithoutOrgArray = Array.isArray(membersWithoutOrgResult)
			? membersWithoutOrgResult
			: membersWithoutOrgResult.rows || [membersWithoutOrgResult] || [];
		const orphanedMembers = Number(membersWithoutOrgArray[0]?.count || 0);
		if (orphanedMembers > 0) {
			issues.push(`${orphanedMembers} organization members without valid organization`);
			console.log(`   ⚠️  Found ${orphanedMembers} organization members without valid organization`);
		} else {
			console.log(`   ✅ All organization members have valid organizations`);
		}

		// Subscriptions without users
		const subsWithoutUsersResult = await db.execute(sql`
			SELECT COUNT(*) as count
			FROM subscriptions s
			LEFT JOIN users u ON s.user_id = u.id
			WHERE u.id IS NULL;
		`);

		const subsWithoutUsersArray = Array.isArray(subsWithoutUsersResult)
			? subsWithoutUsersResult
			: subsWithoutUsersResult.rows || [subsWithoutUsersResult] || [];
		const orphanedSubs = Number(subsWithoutUsersArray[0]?.count || 0);
		if (orphanedSubs > 0) {
			issues.push(`${orphanedSubs} subscriptions without valid users`);
			console.log(`   ⚠️  Found ${orphanedSubs} subscriptions without valid users`);
		} else {
			console.log(`   ✅ All subscriptions have valid users`);
		}

		// Organizations without members
		const orgsWithoutMembersResult = await db.execute(sql`
			SELECT o.id, o.name, COUNT(om.id) as member_count
			FROM organizations o
			LEFT JOIN organization_members om ON o.id = om.organization_id
			GROUP BY o.id, o.name
			HAVING COUNT(om.id) = 0;
		`);

		const orgsWithoutMembersArray = Array.isArray(orgsWithoutMembersResult)
			? orgsWithoutMembersResult
			: orgsWithoutMembersResult.rows || [orgsWithoutMembersResult] || [];
		const orphanedOrgs = orgsWithoutMembersArray.length;
		if (orphanedOrgs > 0) {
			issues.push(`${orphanedOrgs} organizations without members`);
			console.log(`   ⚠️  Found ${orphanedOrgs} organizations without members`);
		} else {
			console.log(`   ✅ All organizations have members`);
		}

		if (issues.length > 0) {
			console.log('\n⚠️  Orphaned data found:');
			for (const issue of issues) {
				console.log(`   - ${issue}`);
			}
			return false;
		}

		console.log('\n✅ No orphaned data found');
		return true;
	} catch (error) {
		console.log(
			`❌ Orphaned data check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
	console.log('\n📊 Database Statistics:');

	const db = getPoolClient();

	try {
		const statsResult = await db.execute(sql`
			SELECT
				(SELECT COUNT(*) FROM users) as user_count,
				(SELECT COUNT(*) FROM organizations) as org_count,
				(SELECT COUNT(*) FROM subscriptions) as subscription_count,
				(SELECT COUNT(*) FROM organization_members) as member_count;
		`);

		const statsArray = Array.isArray(statsResult)
			? statsResult
			: statsResult.rows || [statsResult] || [];
		const statsData = statsArray[0] as any;
		if (statsData) {
			console.log(`   👥 Users: ${statsData.user_count || 0}`);
			console.log(`   🏢 Organizations: ${statsData.org_count || 0}`);
			console.log(`   💳 Subscriptions: ${statsData.subscription_count || 0}`);
			console.log(`   👤 Organization Members: ${statsData.member_count || 0}`);
		}
	} catch (error) {
		console.log(
			`   ⚠️  Could not retrieve statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
}

/**
 * Main verification function
 */
async function verifyDatabase() {
	console.log('🚀 Neon Database Verification\n');
	console.log('='.repeat(60));

	const results = {
		connection: await verifyConnection(),
		schema: await validateSchema(),
		rls: await verifyRLSPolicies(),
		orphanedData: await identifyOrphanedData(),
	};

	await getDatabaseStats();

	console.log(`\n${'='.repeat(60)}`);
	console.log('📋 Verification Summary:');
	console.log('='.repeat(60));

	for (const [check, passed] of Object.entries(results)) {
		const icon = passed ? '✅' : '❌';
		const name = check.charAt(0).toUpperCase() + check.slice(1);
		console.log(`${icon} ${name}`);
	}

	const allPassed = Object.values(results).every((result) => result);

	if (allPassed) {
		console.log('\n🎉 All verifications passed!');
	} else {
		console.log('\n⚠️  Some verifications failed. Please review the issues above.');
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
	verifyDatabase().catch((error) => {
		console.error('💥 Verification failed:', error);
		process.exit(1);
	});
}

export {
	verifyDatabase,
	verifyConnection,
	validateSchema,
	verifyRLSPolicies,
	identifyOrphanedData,
};
