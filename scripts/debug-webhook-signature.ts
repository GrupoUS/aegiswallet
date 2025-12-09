/**
 * Debug webhook signature to identify the issue
 */

import crypto from 'crypto';

const debugWebhookSignature = () => {
	const webhookSecret = 'whsec_VNHnDaMyTeNOTY4Tq6d3hsI7Pknr+3iU';

	console.log('\n🔍 Debugging Webhook Signature');
	console.log('==================================\n');

	// Create a test payload (same as Clerk would send)
	const testPayload = {
		type: 'user.created',
		data: {
			id: 'user_test_123',
			email_addresses: [{ email_address: 'test@example.com' }],
		},
	};

	const payloadString = JSON.stringify(testPayload);
	const timestamp = Math.floor(Date.now() / 1000);
	const signedPayload = `${timestamp}.${payloadString}`;

	console.log('📝 Payload:');
	console.log(payloadString);
	console.log('\n⏰ Timestamp:', timestamp);
	console.log('\n📄 Signed Payload:');
	console.log(signedPayload);

	// Create signature with the secret
	const signature = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

	console.log('\n🔐 Generated Signature:');
	console.log(`v1,${signature}`);
	console.log('\n🔑 Secret Used:', webhookSecret.substring(0, 12) + '...');

	// Verify the signature (same as webhook does)
	try {
		const wh = new (require('svix').Webhook)(webhookSecret);
		const verified = wh.verify(payloadString, {
			'svix-id': crypto.randomUUID(),
			'svix-timestamp': timestamp.toString(),
			'svix-signature': `v1,${signature}`,
		});

		console.log('\n✅ Signature verification SUCCESS');
		console.log('Verified event:', verified.type);
	} catch (error) {
		console.error('\n❌ Signature verification FAILED:', error.message);
	}

	// Test with different secret formats
	console.log('\n🧪 Testing Different Secret Formats:');
	console.log('=====================================');

	const secretsToTest = [
		webhookSecret,
		webhookSecret.substring(6), // Without whsec_ prefix
		'whsec_test' + webhookSecret.substring(6), // Different format
	];

	secretsToTest.forEach((secret, index) => {
		const testSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

		console.log(`\nTest ${index + 1}:`);
		console.log(`Secret: ${secret.substring(0, 12)}...`);
		console.log(`Signature: v1,${testSig.substring(0, 16)}...`);
	});
};

debugWebhookSignature();
