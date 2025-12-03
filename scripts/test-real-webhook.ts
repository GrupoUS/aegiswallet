/**
 * Test webhook with actual Clerk webhook format
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const testRealWebhook = async () => {
	// Use the actual webhook URL
	const webhookUrl = 'https://aegiswallet.vercel.app/api/webhooks/clerk';
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || 'whsec_VNHnDaMyTeNOTY4Tq6d3hsI7Pknr+3iU';

	console.log('\n🧪 Testing Real Clerk Webhook');
	console.log('===============================\n');
	
	// Create a realistic user.created event payload
	// This mimics what Clerk actually sends
	const eventId = 'evt_' + Math.random().toString(36).substr(2, 9);
	const testPayload = {
		object: 'event',
		id: eventId,
		type: 'user.created',
		created_at: Math.floor(Date.now() / 1000),
		data: {
			object: 'user',
			id: 'user_' + Math.random().toString(36).substr(2, 9),
			email_addresses: [
				{
					id: 'idn_' + Math.random().toString(36).substr(2, 9),
					email_address: 'webhook-test-' + Date.now() + '@example.com',
					verification: {
						status: 'verified',
						strategy: 'email_code',
					},
					linked_to: [
						{
							type: 'oauth_google',
							id: 'idn_oauth_google_' + Math.random().toString(36).substr(2, 9),
						},
					],
				},
			],
			phone_numbers: [],
			web3_wallets: [],
			username: null,
			first_name: 'Webhook',
			last_name: 'Test',
			birthday: null,
			gender: null,
			profile_image_url: null,
			public_metadata: {},
			private_metadata: {},
			unsafe_metadata: {},
			email_addresses_count: 1,
			phone_numbers_count: 0,
			web3_wallets_count: 0,
			created_at: Math.floor(Date.now() / 1000),
			updated_at: Math.floor(Date.now() / 1000),
			last_sign_in_at: null,
			delete_self_enabled: false,
			created_by: 'admin',
			updated_by: 'admin',
			has_image: false,
			external_id: null,
			saml_accounts: [],
		},
	};

	const payloadString = JSON.stringify(testPayload);
	const timestamp = Math.floor(Date.now() / 1000);
	const signedPayload = `${timestamp}.${payloadString}`;
	
	// Generate signature
	const signature = crypto
		.createHmac('sha256', webhookSecret)
		.update(signedPayload)
		.digest('hex');

	const headers = {
		'svix-id': testPayload.id,
		'svix-timestamp': timestamp.toString(),
		'svix-signature': `v1,${signature}`,
		'Content-Type': 'application/json',
		'User-Agent': 'Clerk-Webhooks/1.0',
	};

	console.log('📤 Sending webhook...');
	console.log(`📡 URL: ${webhookUrl}`);
	console.log(`🆔 Event ID: ${testPayload.id}`);
	console.log(`👤 Test Email: ${testPayload.data.email_addresses[0]?.email_address}`);
	console.log(`🔑 Signature Length: ${signature.length} chars\n`);

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers,
			body: payloadString,
			timeout: 15000,
		});

		console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
		
		const responseText = await response.text();
		console.log('\n📄 Response Body:');
		console.log(responseText);

		if (response.ok) {
			console.log('\n✅ SUCCESS! Webhook accepted');
			console.log('   The user should now be created in the database');
			
			// Wait a moment and check
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			console.log('\n🔍 Checking if user was created...');
			// You would need to run check-recent-users.ts here
		} else {
			if (response.status === 400 && responseText.includes('signature')) {
				console.log('\n❌ Signature verification failed');
				console.log('   This means the webhook secret in production is different');
				console.log('   Please check your Clerk Dashboard webhook configuration');
			} else {
				console.log('\n⚠️  Webhook failed with unexpected error');
			}
		}
	} catch (error) {
		console.error('\n❌ Error:', error);
		
		if (error instanceof Error) {
			if (error.message.includes('timeout')) {
				console.log('\n⏱️  Webhook timed out - this might indicate a processing issue');
			}
		}
	}
};

testRealWebhook();
