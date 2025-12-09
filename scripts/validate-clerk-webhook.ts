/**
 * Validate Clerk webhook environment and configuration
 * Ensures all necessary settings are in place for user creation
 */

import { neon } from '@neondatabase/serverless';

const validateClerkWebhook = async () => {
	console.log('\n🔧 Validating Clerk Webhook Configuration...\n');

	// Check required environment variables
	const requiredVars = ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'DATABASE_URL'];

	const optionalVars = ['CLERK_WEBHOOK_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'];

	console.log('📋 Environment Variables:');
	console.log('=========================');

	let allRequiredPresent = true;

	for (const varName of requiredVars) {
		const value = process.env[varName];
		if (!value) {
			console.log(`❌ ${varName}: NOT SET (Required)`);
			allRequiredPresent = false;
		} else {
			console.log(`✅ ${varName}: SET`);
		}
	}

	console.log('\n📋 Optional Environment Variables:');
	console.log('===============================');

	for (const varName of optionalVars) {
		const value = process.env[varName];
		if (!value) {
			console.log(`⚠️  ${varName}: NOT SET (Optional)`);
		} else {
			// Mask sensitive values
			const masked =
				varName.toLowerCase().includes('secret') || varName.toLowerCase().includes('key')
					? `${value.substring(0, 8)}...`
					: value;
			console.log(`✅ ${varName}: SET (${masked})`);
		}
	}

	// Validate webhook secret format
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (webhookSecret) {
		console.log('\n🔐 Webhook Secret Validation:');
		console.log('==============================');

		if (webhookSecret.startsWith('whsec_')) {
			console.log(`✅ Format: Valid Clerk webhook secret format`);
			console.log(`✅ Length: ${webhookSecret.length} characters`);
		} else if (webhookSecret.length < 32) {
			console.log(`⚠️  Length: ${webhookSecret.length} characters (should be at least 32)`);
		} else {
			console.log(`✅ Length: ${webhookSecret.length} characters`);
		}
	}

	// Validate database connection
	console.log('\n🗄️  Database Connection:');
	console.log('========================');

	try {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			console.log('❌ DATABASE_URL is not set');
			allRequiredPresent = false;
		} else {
			const sql = neon(databaseUrl);
			const result = await sql`SELECT 1 as test`;
			if (result[0].test === 1) {
				console.log('✅ Database connection successful');
			}
		}
	} catch (error) {
		console.log('❌ Database connection failed:', error instanceof Error ? error.message : error);
		allRequiredPresent = false;
	}

	// Check if webhook files exist
	console.log('\n📁 Webhook Files:');
	console.log('================');

	const webhookFile = 'src/server/webhooks/clerk.ts';
	try {
		await import(`../${webhookFile}`);
		console.log(`✅ ${webhookFile}: Found and importable`);
	} catch (error) {
		console.log(`❌ ${webhookFile}: Not found or has errors`);
	}

	// Validate Clerk key format
	const clerkSecretKey = process.env.CLERK_SECRET_KEY;
	if (clerkSecretKey) {
		console.log('\n🔑 Clerk Key Validation:');
		console.log('=========================');

		if (clerkSecretKey.startsWith('sk_test_') || clerkSecretKey.startsWith('sk_live_')) {
			const env = clerkSecretKey.startsWith('sk_test_') ? 'Test' : 'Production';
			console.log(`✅ Format: Valid Clerk secret key (${env} mode)`);
		} else {
			console.log('⚠️  Format: Unusual key format (should start with sk_test_ or sk_live_)');
		}
	}

	// Final assessment
	console.log('\n📊 Final Assessment:');
	console.log('===================');

	if (allRequiredPresent && webhookSecret) {
		console.log('✅ All required configurations are present');
		console.log('✅ Ready to receive Clerk webhooks');

		console.log('\n🚀 Next Steps:');
		console.log('1. Test webhook: bun scripts/test-clerk-webhook.ts');
		console.log('2. Check user creation: bun scripts/validate-user-integrity.ts');
		console.log('3. Monitor logs for webhook events');
	} else {
		console.log('⚠️  Some configurations are missing');

		if (!webhookSecret) {
			console.log('\n💡 To get your webhook secret:');
			console.log('1. Go to Clerk Dashboard → Webhooks');
			console.log('2. Create/Select webhook endpoint: /api/webhooks/clerk');
			console.log('3. Select events: user.created, user.updated, user.deleted');
			console.log('4. Copy the webhook signing secret');
			console.log('5. Add to your environment: CLERK_WEBHOOK_SECRET=whsec_...');
		}

		process.exit(1);
	}
};

validateClerkWebhook();
