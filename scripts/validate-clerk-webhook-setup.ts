#!/usr/bin/env tsx

/**
 * Clerk Webhook Setup Validation Script
 *
 * Validates webhook configuration, database schema, and dependencies
 * Checks for common issues and provides remediation steps
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';

import { adminDb, db } from '../src/db/client';
import { subscriptions } from '../src/db/schema/billing';
import { users } from '../src/db/schema/users';

// Configuration checks
const configChecks = [
	{
		name: 'CLERK_SECRET_KEY',
		required: true,
		description: 'Clerk API secret key for authentication',
	},
	{
		name: 'CLERK_WEBHOOK_SECRET',
		required: true,
		description: 'Clerk webhook secret for signature verification',
	},
	{
		name: 'DATABASE_URL',
		required: true,
		description: 'Neon database connection URL',
	},
	{
		name: 'DATABASE_URL_UNPOOLED',
		required: false,
		description: 'Direct database connection URL (for transactions)',
	},
];

// Validate environment variables
function validateEnvironment() {
	console.log('\n🔍 Checking environment variables...');

	let allValid = true;
	for (const check of configChecks) {
		const value = process.env[check.name];
		if (!value && check.required) {
			console.log(`❌ ${check.name}: Not set (Required)`);
			console.log(`   ${check.description}`);
			allValid = false;
		} else if (!(value || check.required)) {
			console.log(`⚠️ ${check.name}: Not set (Optional)`);
			console.log(`   ${check.description}`);
		} else {
			console.log(`✅ ${check.name}: Set`);
			if (check.name.includes('SECRET')) {
				console.log(`   ${value.slice(0, 8)}...`);
			}
		}
	}

	// Check webhook secret format
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
		console.log('⚠️ CLERK_WEBHOOK_SECRET: Should start with "whsec_"');
		allValid = false;
	}

	return allValid;
}

// Validate database connection and schema
async function validateDatabase() {
	console.log('\n🗄️ Checking database connection and schema...');

	try {
		// Test database connection
		console.log('🔌 Testing database connection...');
		await db.select().from(users).limit(1);
		console.log('✅ Database connection successful');

		// Check users table structure
		console.log('👤 Checking users table schema...');
		const usersTableInfoResult = await db.execute(`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_name = 'users'
			ORDER BY ordinal_position
		`);

		const usersTableInfo = Array.isArray(usersTableInfoResult)
			? usersTableInfoResult
			: usersTableInfoResult.rows || [usersTableInfoResult] || [];
		const requiredUserColumns = ['id', 'email', 'full_name'];
		const existingUserColumns = usersTableInfo.map((row: any) => row.column_name);

		for (const column of requiredUserColumns) {
			if (existingUserColumns.includes(column)) {
				console.log(`   ✅ users.${column}`);
			} else {
				console.log(`   ❌ users.${column}: Missing required column`);
				return false;
			}
		}

		// Check subscriptions table structure
		console.log('💳 Checking subscriptions table schema...');
		const subscriptionsTableInfoResult = await db.execute(`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_name = 'subscriptions'
			ORDER BY ordinal_position
		`);

		const subscriptionsTableInfo = Array.isArray(subscriptionsTableInfoResult)
			? subscriptionsTableInfoResult
			: subscriptionsTableInfoResult.rows || [subscriptionsTableInfoResult] || [];
		const requiredSubscriptionColumns = [
			'id',
			'user_id',
			'stripe_customer_id',
			'plan_id',
			'status',
		];
		const existingSubscriptionColumns = subscriptionsTableInfo.map((row: any) => row.column_name);

		for (const column of requiredSubscriptionColumns) {
			if (existingSubscriptionColumns.includes(column)) {
				console.log(`   ✅ subscriptions.${column}`);
			} else {
				console.log(`   ❌ subscriptions.${column}: Missing required column`);
				return false;
			}
		}

		return true;
	} catch (error) {
		console.log(
			`❌ Database validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

// Validate Clerk configuration
async function validateClerk() {
	console.log('\n🔐 Checking Clerk configuration...');

	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!secretKey) {
		console.log('❌ CLERK_SECRET_KEY not set');
		return false;
	}

	try {
		const clerkClient = createClerkClient({ secretKey });

		// Test Clerk API access
		console.log('🔑 Testing Clerk API access...');
		const userCount = await clerkClient.users.getUserList({ limit: 1 });
		console.log(`✅ Clerk API accessible (${userCount.totalCount} users in total)`);

		// Check webhook endpoints in Clerk (if available)
		console.log('🪝 Checking webhook endpoints...');
		// Note: This would require Clerk Admin API access which might not be available
		console.log('   ℹ️ Webhook endpoint verification requires Clerk Dashboard access');
		console.log('   📋 Please verify webhook endpoints in your Clerk Dashboard:');
		console.log('      https://dashboard.clerk.com/apps/webhooks');

		return true;
	} catch (error) {
		console.log(
			`❌ Clerk validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

// Validate webhook handler file
function validateWebhookHandler() {
	console.log('\n📁 Checking webhook handler file...');

	const webhookFilePath = join(process.cwd(), 'src/server/webhooks/clerk.ts');

	try {
		const fileContent = readFileSync(webhookFilePath, 'utf-8');

		// Check for required imports
		const requiredImports = [
			'@clerk/backend',
			'svix',
			'hono',
			'drizzle-orm',
			'db/client',
			'db/schema',
			'stripe/customer.service',
		];

		for (const importName of requiredImports) {
			if (fileContent.includes(importName)) {
				console.log(`   ✅ Import: ${importName}`);
			} else {
				console.log(`   ⚠️ Import: ${importName} (might be using different path)`);
			}
		}

		// Check for required webhook events
		const requiredEvents = ['user.created', 'user.updated', 'user.deleted'];
		for (const event of requiredEvents) {
			if (fileContent.includes(event)) {
				console.log(`   ✅ Event handler: ${event}`);
			} else {
				console.log(`   ❌ Event handler: ${event}`);
				return false;
			}
		}

		// Check for error handling
		if (fileContent.includes('try') && fileContent.includes('catch')) {
			console.log('   ✅ Error handling implemented');
		} else {
			console.log('   ⚠️ Error handling might be insufficient');
		}

		return true;
	} catch (error) {
		console.log(
			`❌ Webhook handler validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

// Validate Stripe integration
async function validateStripe() {
	console.log('\n💰 Checking Stripe integration...');

	const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
	if (!stripeSecretKey) {
		console.log('⚠️ STRIPE_SECRET_KEY not set (Stripe integration disabled)');
		return true; // Not critical for basic webhook functionality
	}

	try {
		// Check if Stripe service exists
		const stripeServicePath = join(process.cwd(), 'src/services/stripe/customer.service.ts');
		const stripeServiceContent = readFileSync(stripeServicePath, 'utf-8');

		if (
			stripeServiceContent.includes('createCustomer') &&
			stripeServiceContent.includes('deleteCustomer')
		) {
			console.log('   ✅ Stripe customer service methods found');
		} else {
			console.log('   ❌ Stripe customer service methods missing');
			return false;
		}

		console.log('✅ Stripe integration validated');
		return true;
	} catch (error) {
		console.log(
			`❌ Stripe validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

// Check webhook endpoint accessibility
async function validateWebhookEndpoint() {
	console.log('\n🌐 Checking webhook endpoint accessibility...');

	const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/clerk';

	try {
		// Basic connectivity test
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({ test: true }),
		});

		if (response.status === 400) {
			console.log('✅ Webhook endpoint accessible (correctly rejected invalid request)');
			return true;
		}
		if (response.status >= 500) {
			console.log(`⚠️ Webhook endpoint returned server error: ${response.status}`);
			return false;
		}
		console.log(`ℹ️ Webhook endpoint returned: ${response.status} ${response.statusText}`);
		return true;
	} catch (error) {
		console.log(
			`❌ Webhook endpoint not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		console.log(
			'   📋 Please ensure your server is running and webhook endpoint is properly routed',
		);
		return false;
	}
}

// Generate remediation steps
function generateRemediation() {
	console.log('\n🔧 Remediation Steps:');
	console.log('');
	console.log('1. Environment Variables:');
	console.log('   - Set CLERK_SECRET_KEY in your environment');
	console.log('   - Set CLERK_WEBHOOK_SECRET (get from Clerk Dashboard)');
	console.log('   - Set DATABASE_URL (Neon database connection string)');
	console.log('');
	console.log('2. Clerk Dashboard:');
	console.log('   - Navigate to https://dashboard.clerk.com/apps/webhooks');
	console.log('   - Create webhook endpoint pointing to your API');
	console.log('   - Subscribe to: user.created, user.updated, user.deleted');
	console.log('   - Copy the webhook secret to CLERK_WEBHOOK_SECRET');
	console.log('');
	console.log('3. Database:');
	console.log('   - Ensure database tables are created: bun db:push');
	console.log('   - Run migrations: bun db:migrate');
	console.log('');
	console.log('4. Testing:');
	console.log('   - Run webhook tests: bun scripts/test-clerk-webhook.ts');
	console.log('   - Check logs for webhook processing errors');
}

// Main validation function
async function runValidation() {
	console.log('🚀 Starting Clerk webhook setup validation...\n');

	const results = {
		environment: validateEnvironment(),
		database: await validateDatabase(),
		clerk: await validateClerk(),
		webhookHandler: validateWebhookHandler(),
		stripe: await validateStripe(),
		webhookEndpoint: await validateWebhookEndpoint(),
	};

	const allPassed = Object.values(results).every((result) => result);

	console.log('\n📊 Validation Summary:');
	for (const [check, passed] of Object.entries(results)) {
		const icon = passed ? '✅' : '❌';
		console.log(`${icon} ${check.charAt(0).toUpperCase() + check.slice(1)}`);
	}

	if (allPassed) {
		console.log('\n🎉 All validations passed! Your webhook setup is ready.');
	} else {
		console.log('\n💥 Some validations failed. Please follow the remediation steps.');
		generateRemediation();
		process.exit(1);
	}
}

// Check if running directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
	runValidation().catch((error) => {
		console.error('💥 Validation failed:', error);
		process.exit(1);
	});
} else {
	// Also run if called via bun directly
	runValidation().catch((error) => {
		console.error('💥 Validation failed:', error);
		process.exit(1);
	});
}

export { runValidation, validateEnvironment, validateDatabase, validateClerk };
