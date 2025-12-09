/**
 * Test Clerk webhook functionality
 * Used to verify webhook setup and troubleshoot user creation issues
 */

import crypto from 'crypto';

const testWebhook = async () => {
	const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/clerk';
	const clerkSecret = process.env.CLERK_WEBHOOK_SECRET;

	if (!clerkSecret) {
		console.error('❌ CLERK_WEBHOOK_SECRET environment variable is required');
		process.exit(1);
	}

	// Create test payload for user creation
	const testPayload = {
		type: 'user.created',
		data: {
			id: 'user_test_' + Date.now(),
			email_addresses: [
				{
					email_address: 'test@example.com',
					verification: {
						status: 'verified',
						strategy: 'email_code',
					},
				},
			],
			first_name: 'Test',
			last_name: 'User',
			phone_numbers: [],
			username: null,
			web3_wallets: [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		},
	};

	// Create Svix headers for webhook signature
	const timestamp = Math.floor(Date.now() / 1000);
	const payloadString = JSON.stringify(testPayload);
	const signedPayload = `${timestamp}.${payloadString}`;
	const signature = crypto.createHmac('sha256', clerkSecret).update(signedPayload).digest('hex');

	const headers = {
		'svix-id': crypto.randomUUID(),
		'svix-timestamp': timestamp.toString(),
		'svix-signature': `v1,${signature}`,
		'Content-Type': 'application/json',
	};

	console.log('\n📋 Testing Clerk webhook...');
	console.log(`🔗 Webhook URL: ${webhookUrl}`);
	console.log(`📝 Event Type: ${testPayload.type}`);
	console.log(`👤 Test User ID: ${testPayload.data.id}`);
	console.log(`📧 Test Email: ${testPayload.data.email_addresses[0]?.email_address}`);

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers,
			body: payloadString,
		});

		console.log(`\n✅ Response Status: ${response.status} ${response.statusText}`);

		const responseText = await response.text();
		console.log('\n📄 Response Body:');
		console.log(responseText);

		if (response.ok) {
			console.log('\n✅ Webhook test completed successfully!');
		} else {
			console.log('\n⚠️ Webhook test completed with warnings');
		}
	} catch (error) {
		console.error('\n❌ Error testing webhook:', error);

		if (error instanceof Error) {
			if (error.message.includes('ECONNREFUSED')) {
				console.log('\n💡 Tip: Make sure the server is running on port 3000');
				console.log('   Run: bun dev');
			} else if (error.message.includes('ENOTFOUND')) {
				console.log('\n💡 Tip: Check if the webhook URL is correct');
			}
		}
		process.exit(1);
	}

	process.exit(0);
};

testWebhook();
