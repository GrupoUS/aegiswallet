/**
 * Test if the webhook secret is working correctly
 * This tests the actual webhook signature validation
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const testWebhookSecret = async () => {
	const webhookSecret = 'whsec_VNHnDaMyTeNOTY4Tq6d3hsI7Pknr+3iU';
	// Use Vercel production URL
	const webhookUrl = 'https://aegiswallet.vercel.app/api/webhooks/clerk';

	console.log('\n🔐 Testing Webhook Secret');
	console.log(`📡 Webhook URL: ${webhookUrl}`);
	console.log(`🔑 Secret Length: ${webhookSecret.length} characters\n`);

	// Create a test payload
	const testPayload = {
		type: 'user.created',
		data: {
			id: 'user_test_' + Date.now(),
			email_addresses: [
				{
					email_address: 'webhook-test@example.com',
					verification: {
						status: 'verified',
						strategy: 'email_code',
					},
				},
			],
			first_name: 'Webhook',
			last_name: 'Test',
			created_at: new Date().toISOString(),
		},
	};

	// Create proper Svix headers
	const timestamp = Math.floor(Date.now() / 1000);
	const payloadString = JSON.stringify(testPayload);
	const signedPayload = `${timestamp}.${payloadString}`;
	const signature = crypto
		.createHmac('sha256', webhookSecret)
		.update(signedPayload)
		.digest('hex');

	const headers = {
		'svix-id': crypto.randomUUID(),
		'svix-timestamp': timestamp.toString(),
		'svix-signature': `v1,${signature}`,
		'Content-Type': 'application/json',
	};

	console.log('📤 Sending test webhook...');
	console.log(`📝 Event: ${testPayload.type}`);
	console.log(`👤 Test User: ${testPayload.data.email_addresses[0]?.email_address}`);

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers,
			body: payloadString,
			timeout: 10000,
		});

		console.log(`\n✅ Response Status: ${response.status} ${response.statusText}`);
		
		const responseText = await response.text();
		
		if (response.ok) {
			console.log('\n✅ SUCCESS: Webhook processed successfully!');
			console.log('\n📄 Response:');
			console.log(responseText);
			
			// Check if user was created
			if (responseText.includes('success') || responseText.includes('ok')) {
				console.log('\n✅ Webhook secret is working correctly');
				console.log('✅ New user creation is functional');
			}
		} else {
			console.log('\n⚠️  Webhook returned an error:');
			console.log(responseText);
			
			// Parse common errors
			if (responseText.includes('signature')) {
				console.log('\n❌ ERROR: Webhook signature validation failed');
				console.log('   The webhook secret might be incorrect');
			} else if (responseText.includes('user_id')) {
				console.log('\n❌ ERROR: Database issue detected');
				console.log('   Check user table constraints');
			}
		}
	} catch (error) {
		console.error('\n❌ Error testing webhook:');
		
		if (error instanceof Error) {
			if (error.message.includes('ECONNREFUSED')) {
				console.log('\n💡 CONNECTION ERROR: Server is not running');
				console.log('   To fix: Run "bun dev" to start the server');
			} else if (error.message.includes('ENOTFOUND')) {
				console.log('\n💡 DNS ERROR: Could not resolve hostname');
				console.log('   Check if the webhook URL is correct');
			} else if (error.message.includes('timeout')) {
				console.log('\n💡 TIMEOUT: Webhook took too long to respond');
				console.log('   The webhook handler might be hanging');
			}
		}
		process.exit(1);
	}

	process.exit(0);
};

testWebhookSecret();
