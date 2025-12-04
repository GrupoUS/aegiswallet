/**
 * Script to check subscription status in database
 * Usage: bun scripts/check-subscription-status.ts [email]
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL ?? '');

async function checkSubscriptionStatus(userEmail?: string) {
	console.log('🔍 Checking subscription status...\n');

	// Check user_subscriptions table
	console.log('=== USER_SUBSCRIPTIONS TABLE ===');
	const subs = await sql`SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 10`;
	if (subs.length === 0) {
		console.log('❌ No subscriptions found in user_subscriptions table');
	} else {
		console.log(`✅ Found ${subs.length} subscription(s):`);
		console.table(subs);
	}

	// Check profiles table
	console.log('\n=== PROFILES TABLE ===');
	const profiles = await sql`
    SELECT id, user_id, email, subscription_tier, stripe_customer_id, created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 10
  `;
	if (profiles.length === 0) {
		console.log('❌ No profiles found');
	} else {
		console.log(`✅ Found ${profiles.length} profile(s):`);
		console.table(profiles);
	}

	// If email provided, search specifically
	if (userEmail) {
		console.log(`\n=== SEARCHING FOR EMAIL: ${userEmail} ===`);
		const profile = await sql`SELECT * FROM profiles WHERE email = ${userEmail}`;
		if (profile.length === 0) {
			console.log(`❌ No profile found for email: ${userEmail}`);
		} else {
			console.log('✅ Profile found:');
			console.log(JSON.stringify(profile[0], null, 2));

			// Check subscription for this user
			const userId = profile[0].user_id;
			if (userId) {
				const userSub = await sql`SELECT * FROM user_subscriptions WHERE user_id = ${userId}`;
				if (userSub.length === 0) {
					console.log(`❌ No subscription found for user_id: ${userId}`);
				} else {
					console.log('✅ Subscription found:');
					console.log(JSON.stringify(userSub[0], null, 2));
				}
			}
		}
	}

	// Check subscription_plans table
	console.log('\n=== SUBSCRIPTION_PLANS TABLE ===');
	const plans =
		await sql`SELECT id, name, stripe_price_id, price, currency FROM subscription_plans ORDER BY price`;
	console.table(plans);
}

const email = process.argv[2] || 'msm.jur@gmail.com';
checkSubscriptionStatus(email).catch(console.error);
