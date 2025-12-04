/**
 * Script to manually create subscription for a user
 * Usage: bun scripts/create-manual-subscription.ts <user_email> <plan_id>
 *
 * Plan IDs: free, basic, advanced
 */

import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL ?? '');
const db = drizzle(sql, { schema });

async function createManualSubscription(userEmail: string, userPlanId: string) {
	console.log(`\n🔧 Creating subscription for ${userEmail} with plan: ${userPlanId}\n`);

	// Find user by email
	const [user] = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.email, userEmail))
		.limit(1);

	if (!user) {
		console.error(`❌ User not found: ${userEmail}`);
		process.exit(1);
	}

	console.log(`✅ Found user: ${user.fullName || user.email} (${user.id})`);

	// Check if subscription already exists
	const [existingSub] = await db
		.select()
		.from(schema.subscriptions)
		.where(eq(schema.subscriptions.userId, user.id))
		.limit(1);

	if (existingSub) {
		console.log(`⚠️ Subscription already exists with plan: ${existingSub.planId}`);
		console.log(`  Status: ${existingSub.status}`);
		console.log(`  Updating to plan: ${userPlanId}...`);

		await db
			.update(schema.subscriptions)
			.set({
				planId: userPlanId,
				status: 'active',
				updatedAt: new Date(),
			})
			.where(eq(schema.subscriptions.userId, user.id));

		console.log(`✅ Subscription updated to ${userPlanId}`);
	} else {
		// Create new subscription
		const now = new Date();
		const nextMonth = new Date(now);
		nextMonth.setMonth(nextMonth.getMonth() + 1);

		await db.insert(schema.subscriptions).values({
			userId: user.id,
			planId: userPlanId,
			status: 'active',
			currentPeriodStart: now,
			currentPeriodEnd: nextMonth,
			cancelAtPeriodEnd: false,
			createdAt: now,
			updatedAt: now,
		});

		console.log(`✅ New subscription created with plan: ${userPlanId}`);
	}

	// Verify
	const [verifiedSub] = await db
		.select()
		.from(schema.subscriptions)
		.where(eq(schema.subscriptions.userId, user.id))
		.limit(1);

	console.log(`\n📋 Current subscription status:`);
	console.log(JSON.stringify(verifiedSub, null, 2));
}

const inputEmail = process.argv[2] || 'msm.jur@gmail.com';
const inputPlanId = process.argv[3] || 'basic';

createManualSubscription(inputEmail, inputPlanId).catch(console.error);
