/**
 * Setup Clerk webhook configuration
 * Provides guidance and checks for webhook setup
 */

import crypto from 'crypto';

const setupClerkWebhook = async () => {
	console.log('\n🔧 Clerk Webhook Setup Guide');
	console.log('============================\n');

	console.log('📋 Prerequisites:');
	console.log('1. Clerk account created');
	console.log('2. Application configured in Clerk Dashboard');
	console.log('3. Server running (bun dev) on port 3000 or deployed\n');

	console.log('🌐 Webhook Configuration Steps:');
	console.log('=================================\n');

	console.log('1. Go to Clerk Dashboard: https://dashboard.clerk.com/');
	console.log('2. Select your application');
	console.log('3. Navigate to "Webhooks" in the sidebar');
	console.log('4. Click "Add endpoint" or select existing webhook\n');

	const webhookUrl = process.env.VERCEL_URL 
		? `https://${process.env.VERCEL_URL}/api/webhooks/clerk`
		: process.env.NODE_ENV === 'production'
		? 'https://your-domain.com/api/webhooks/clerk'
		: 'http://localhost:3000/api/webhooks/clerk';

	console.log(`5. Webhook URL: ${webhookUrl}`);
	console.log('6. Select these events:');
	console.log('   - user.created (When a user signs up)');
	console.log('   - user.updated (When user profile changes)');
	console.log('   - user.deleted (When user deletes account)');
	console.log('7. Copy the "Signing Secret" (starts with "whsec_")');
	console.log('8. Add to your .env file:\n');

	console.log('   CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here\n');

	// Generate a secure webhook secret for testing
	const testSecret = 'whsec_' + crypto.randomBytes(32).toString('hex');
	console.log('🔑 For testing only, you can generate a test secret:');
	console.log(`   ${testSecret}\n`);

	console.log('🧪 Testing Your Webhook:');
	console.log('========================\n');

	console.log('After setting up your webhook:');
	console.log('1. Run the validation script:');
	console.log('   bun scripts/validate-clerk-webhook.ts\n');
	console.log('2. Test the webhook endpoint:');
	console.log('   bun scripts/test-clerk-webhook.ts\n');

	// Check if webhook secret is configured
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.log('⚠️  Current Status: Webhook secret NOT configured\n');
		console.log('Please add CLERK_WEBHOOK_SECRET to your .env file');
	} else {
		console.log('✅ Current Status: Webhook secret is configured\n');
		
		if (webhookSecret.startsWith('whsec_')) {
			console.log('✅ Format: Valid Clerk webhook secret');
		} else {
			console.log('⚠️  Format: Should start with "whsec_"');
		}
	}

	console.log('📝 Troubleshooting:');
	console.log('==================\n');
	console.log('If webhook events are not received:');
	console.log('1. Verify webhook URL is accessible');
	console.log('2. Check server logs for webhook errors');
	console.log('3. Ensure webhook is active in Clerk Dashboard');
	console.log('4. Validate the signing secret matches\n');

	console.log('📚 Additional Resources:');
	console.log('========================\n');
	console.log('Clerk Webhooks Documentation:');
	console.log('https://clerk.com/docs/reference/backend-api/webhooks');
	console.log('\nClerk Webhook Signing:');
	console.log('https://clerk.com/docs/webhooks/sync-events');

	process.exit(0);
};

setupClerkWebhook();
