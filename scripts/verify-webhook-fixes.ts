#!/usr/bin/env tsx
/**
 * Webhook Fix Verification Script
 *
 * Verifies that all the critical fixes have been properly applied
 * to the Clerk webhook implementation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
	issue: string;
	fixed: boolean;
	description: string;
}

async function verifyFixes(): Promise<VerificationResult[]> {
	console.log('🔍 Verifying webhook fixes...\n');

	const webhookFilePath = join(process.cwd(), 'src/server/webhooks/clerk.ts');
	const webhookContent = readFileSync(webhookFilePath, 'utf-8');

	const results: VerificationResult[] = [
		{
			issue: 'Database client inconsistency',
			fixed:
				webhookContent.includes("import { db } from '@/db/client'") &&
				!webhookContent.includes('getPoolClient()'),
			description: 'Should use default db client instead of getPoolClient() for simple operations',
		},
		{
			issue: 'Schema import mismatch',
			fixed:
				webhookContent.includes("import { subscriptions } from '@/db/schema/billing'") &&
				webhookContent.includes("import { users } from '@/db/schema/users'"),
			description: 'Should import from correct schema modules',
		},
		{
			issue: 'Environment variable validation',
			fixed:
				webhookContent.includes('CLERK_WEBHOOK_SECRET environment variable is not set') &&
				webhookContent.includes('CLERK_SECRET_KEY environment variable is not set'),
			description: 'Should validate required environment variables at startup',
		},
		{
			issue: 'Webhook header validation',
			fixed:
				webhookContent.includes('Missing required webhook headers') &&
				webhookContent.includes('svix-id') &&
				webhookContent.includes('svix-timestamp') &&
				webhookContent.includes('svix-signature'),
			description: 'Should validate all required webhook headers',
		},
		{
			issue: 'Enhanced error handling',
			fixed:
				webhookContent.includes('Failed to create Stripe customer') &&
				webhookContent.includes('Database operation failed during user creation') &&
				webhookContent.includes('Failed to delete user data') &&
				webhookContent.includes('Failed to update user'),
			description: 'Should provide specific error messages for different failure scenarios',
		},
		{
			issue: 'Stripe rollback mechanism',
			fixed:
				webhookContent.includes('Attempt to rollback Stripe customer creation') &&
				webhookContent.includes('Failed to rollback Stripe customer'),
			description: 'Should rollback Stripe customer creation if database operations fail',
		},
		{
			issue: 'Enhanced logging',
			fixed: webhookContent.includes('stack: error instanceof Error ? error.stack : undefined'),
			description: 'Should include stack traces in error logs for debugging',
		},
		{
			issue: 'Proper Clerk client initialization',
			fixed:
				webhookContent.includes('createClerkClient({ secretKey: clerkSecretKey })') &&
				!webhookContent.includes("secretKey: clerkSecretKey || ''"),
			description: 'Should properly initialize Clerk client with validated secret key',
		},
	];

	return results;
}

async function verifyDatabaseSchema(): Promise<VerificationResult[]> {
	console.log('🗄️ Verifying database schema...\n');

	// This would normally connect to the database, but for now we'll check the schema files
	const schemaDir = join(process.cwd(), 'src/db/schema');
	const results: VerificationResult[] = [];

	try {
		// Check users schema
		const usersSchemaPath = join(schemaDir, 'users.ts');
		const usersSchema = readFileSync(usersSchemaPath, 'utf-8');

		const hasRequiredUserFields =
			usersSchema.includes("id: text('id').primaryKey()") &&
			usersSchema.includes("email: text('email').unique().notNull()") &&
			usersSchema.includes("fullName: text('full_name')");

		results.push({
			issue: 'Users table schema',
			fixed: hasRequiredUserFields,
			description: 'Should have required fields: id, email, fullName',
		});
	} catch (error) {
		results.push({
			issue: 'Users schema file',
			fixed: false,
			description: 'Could not read users schema file',
		});
	}

	try {
		// Check billing schema
		const billingSchemaPath = join(schemaDir, 'billing.ts');
		const billingSchema = readFileSync(billingSchemaPath, 'utf-8');

		const hasRequiredSubscriptionFields =
			billingSchema.includes("subscriptions = pgTable('subscriptions'") &&
			billingSchema.includes("userId: text('user_id')") &&
			billingSchema.includes("stripeCustomerId: text('stripe_customer_id')") &&
			billingSchema.includes("planId: text('plan_id')") &&
			billingSchema.includes('status: subscriptionStatusEnum');

		results.push({
			issue: 'Subscriptions table schema',
			fixed: hasRequiredSubscriptionFields,
			description: 'Should have required fields: userId, stripeCustomerId, planId, status',
		});
	} catch (error) {
		results.push({
			issue: 'Billing schema file',
			fixed: false,
			description: 'Could not read billing schema file',
		});
	}

	return results;
}

async function verifyScripts(): Promise<VerificationResult[]> {
	console.log('📜 Verifying support scripts...\n');

	const scriptsDir = join(process.cwd(), 'scripts');
	const results: VerificationResult[] = [];

	const testScriptPath = join(scriptsDir, 'test-clerk-webhook.ts');
	const validationScriptPath = join(scriptsDir, 'validate-clerk-webhook-setup.ts');

	try {
		const testScriptContent = readFileSync(testScriptPath, 'utf-8');
		const hasTestEvents =
			testScriptContent.includes('user.created') &&
			testScriptContent.includes('user.updated') &&
			testScriptContent.includes('user.deleted') &&
			testScriptContent.includes('testErrorScenarios');

		results.push({
			issue: 'Webhook testing script',
			fixed: hasTestEvents,
			description: 'Should test all webhook events and error scenarios',
		});
	} catch (error) {
		results.push({
			issue: 'Webhook testing script',
			fixed: false,
			description: 'Could not read test script file',
		});
	}

	try {
		const validationScriptContent = readFileSync(validationScriptPath, 'utf-8');
		const hasValidations =
			validationScriptContent.includes('validateEnvironment') &&
			validationScriptContent.includes('validateDatabase') &&
			validationScriptContent.includes('validateClerk') &&
			validationScriptContent.includes('generateRemediation');

		results.push({
			issue: 'Webhook validation script',
			fixed: hasValidations,
			description: 'Should validate environment, database, and Clerk configuration',
		});
	} catch (error) {
		results.push({
			issue: 'Webhook validation script',
			fixed: false,
			description: 'Could not read validation script file',
		});
	}

	return results;
}

async function runVerification() {
	const webhookFixes = await verifyFixes();
	const databaseSchema = await verifyDatabaseSchema();
	const scripts = await verifyScripts();

	const allResults = [...webhookFixes, ...databaseSchema, ...scripts];

	console.log('\n📊 Verification Results:\n');

	let totalFixed = 0;
	const totalIssues = allResults.length;

	for (const result of allResults) {
		const icon = result.fixed ? '✅' : '❌';
		console.log(`${icon} ${result.issue}`);
		console.log(`   ${result.description}`);
		if (result.fixed) {
			totalFixed++;
		}
		console.log('');
	}

	console.log(`\n📈 Summary: ${totalFixed}/${totalIssues} fixes verified`);

	if (totalFixed === totalIssues) {
		console.log('\n🎉 All critical fixes have been successfully applied!');
		console.log('\n📋 Next steps:');
		console.log('1. Set your environment variables (CLERK_WEBHOOK_SECRET, CLERK_SECRET_KEY)');
		console.log('2. Run: bun scripts/validate-clerk-webhook-setup.ts');
		console.log('3. Start your development server: bun dev');
		console.log('4. Test webhooks: bun scripts/test-clerk-webhook.ts');
	} else {
		console.log('\n💥 Some fixes are missing or incomplete.');
		console.log('Please review the failed items above and apply the necessary changes.');
		process.exit(1);
	}
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runVerification().catch((error) => {
		console.error('💥 Verification failed:', error);
		process.exit(1);
	});
}

export { runVerification, verifyFixes, verifyDatabaseSchema, verifyScripts };
