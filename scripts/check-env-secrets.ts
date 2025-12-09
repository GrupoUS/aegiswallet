/**
 * Check environment secrets to ensure they match
 */

const checkEnvSecrets = () => {
	console.log('\n🔍 Checking Environment Secrets');
	console.log('===============================\n');

	// The secret you provided
	const providedSecret = 'whsec_VNHnDaMyTeNOTY4Tq6d3hsI7Pknr+3iU';

	console.log('📝 Provided Secret:');
	console.log(`  Value: ${providedSecret}`);
	console.log(`  Length: ${providedSecret.length} characters`);
	console.log(
		`  Format: ${providedSecret.startsWith('whsec_') ? 'Valid Clerk format' : 'Invalid format'}\n`,
	);

	// Check what's in the environment
	const envSecret = process.env.CLERK_WEBHOOK_SECRET;

	if (envSecret) {
		console.log('🔧 Environment Secret:');
		console.log(`  Value: ${envSecret}`);
		console.log(`  Length: ${envSecret.length} characters`);
		console.log(
			`  Format: ${envSecret.startsWith('whsec_') ? 'Valid Clerk format' : 'Invalid format'}\n`,
		);

		if (envSecret === providedSecret) {
			console.log('✅ Secrets MATCH - This is correct');
		} else {
			console.log('❌ Secrets DO NOT MATCH');
			console.log('\n💡 To fix:');
			console.log('   1. Make sure you have the correct secret from Clerk Dashboard');
			console.log('   2. Update your .env file with: CLERK_WEBHOOK_SECRET=' + providedSecret);
			console.log('   3. Restart your server after updating the environment');
		}
	} else {
		console.log('❌ No CLERK_WEBHOOK_SECRET in environment');
		console.log('\n💡 To fix:');
		console.log('   Add to your .env file:');
		console.log('   CLERK_WEBHOOK_SECRET=' + providedSecret);
	}

	// Instructions for getting the correct secret
	console.log('\n📋 To Get Your Webhook Secret:');
	console.log('===============================');
	console.log('1. Go to: https://dashboard.clerk.com/');
	console.log('2. Select your application');
	console.log('3. Go to "Webhooks" in the sidebar');
	console.log('4. Find your webhook endpoint');
	console.log('5. Click "Show" next to "Signing secret"');
	console.log('6. Copy the secret (should start with "whsec_")');
	console.log('7. Add it to your environment variables\n');

	console.log('⚠️  Common Issues:');
	console.log('================');
	console.log('- Using the wrong secret (test vs production)');
	console.log('- Secret copied incorrectly (missing characters)');
	console.log('- Environment not loaded properly');
	console.log('- Multiple webhook endpoints with different secrets');
};

checkEnvSecrets();
