/**
 * Script to manually create subscription for a user
 * Usage: bun scripts/create-manual-subscription.ts <user_email> <plan_id>
 * 
 * Plan IDs: free, basic, advanced
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL ?? '');
const db = drizzle(sql, { schema });

async function createManualSubscription(email: string, planId: string) {
  console.log(`\n🔧 Creating subscription for ${email} with plan: ${planId}\n`);

  // Find user by email
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
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
    console.log(`  Updating to plan: ${planId}...`);

    await db
      .update(schema.subscriptions)
      .set({
        planId,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.userId, user.id));

    console.log(`✅ Subscription updated to ${planId}`);
  } else {
    // Create new subscription
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await db.insert(schema.subscriptions).values({
      userId: user.id,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ New subscription created with plan: ${planId}`);
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

const email = process.argv[2] || 'msm.jur@gmail.com';
const planId = process.argv[3] || 'basic';

createManualSubscription(email, planId).catch(console.error);
