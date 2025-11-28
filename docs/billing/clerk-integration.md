# Clerk Webhook Integration Guide

This guide explains how to set up Clerk webhooks to sync user lifecycle events with Stripe.

## Overview

The AegisWallet billing system uses Clerk webhooks to:
- Create Stripe customers when users sign up
- Delete Stripe customers when users are deleted (LGPD compliance)
- Store Stripe customer ID in Clerk user metadata

## Step 1: Get Clerk Webhook Secret

1. Go to your Clerk Dashboard
2. Navigate to **Webhooks**
3. Click **Add Endpoint**

## Step 2: Configure Webhook Endpoint

**Endpoint URL:**
```
https://your-domain.com/api/webhooks/clerk
```

**Subscribe to Events:**
- ✅ `user.created`
- ✅ `user.deleted`

## Step 3: Get Signing Secret

After creating the webhook endpoint, Clerk will show you a **Signing Secret**.

Add it to your `.env` file:

```bash
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

## Step 4: How It Works

### User Creation Flow

1. User signs up via Clerk
2. Clerk sends `user.created` webhook
3. Backend receives webhook at `/api/webhooks/clerk`
4. Creates Stripe customer with user email
5. Stores `stripeCustomerId` in Clerk `privateMetadata`
6. Creates free subscription record in database

**Code Flow:**
```typescript
// 1. Webhook received
POST /api/webhooks/clerk
  ↓
// 2. Create Stripe customer
StripeCustomerService.createCustomer(userId, email, name)
  ↓
// 3. Update Clerk metadata
clerkClient.users.updateUserMetadata(userId, {
  privateMetadata: { stripeCustomerId }
})
  ↓
// 4. Create subscription record
db.insert(subscriptions).values({
  userId,
  stripeCustomerId,
  planId: 'free',
  status: 'free'
})
```

### User Deletion Flow

1. User deleted from Clerk Dashboard
2. Clerk sends `user.deleted` webhook
3. Backend receives webhook
4. Fetches user's Stripe customer ID from database
5. Cancels all active Stripe subscriptions
6. Deletes Stripe customer (LGPD compliance)
7. Deletes subscription record from database

**Code Flow:**
```typescript
// 1. Webhook received
POST /api/webhooks/clerk
  ↓
// 2. Find subscription
db.select().from(subscriptions).where(eq(userId, id))
  ↓
// 3. Delete Stripe customer
StripeCustomerService.deleteCustomer(stripeCustomerId)
  ↓
// 4. Delete database record
db.delete(subscriptions).where(eq(userId, id))
```

## Step 5: Local Testing

### Option 1: Use Clerk's Test Events

In Clerk Dashboard > Webhooks > Your Endpoint:
- Click **Send test event**
- Select `user.created` or `user.deleted`
- Check your application logs

### Option 2: Use ngrok for Local Development

```bash
# Install ngrok
scoop install ngrok  # Windows

# Start ngrok
ngrok http 3000

# Use the ngrok URL in Clerk webhook
https://xxxxx.ngrok.io/api/webhooks/clerk
```

## Step 6: Verify Integration

### Check User Creation
1. Create a new user in your app
2. Check Clerk Dashboard > Users - verify user exists
3. Check Stripe Dashboard > Customers - verify customer created
4. Check database `subscriptions` table - verify record exists
5. Check Clerk Dashboard > User > Metadata - verify `stripeCustomerId` is set

### Check User Deletion
1. Delete a user from Clerk Dashboard
2. Check Stripe Dashboard > Customers - verify customer deleted
3. Check database - verify subscription record deleted

## Troubleshooting

### Webhook not receiving events

**Check webhook URL:**
- Ensure URL is publicly accessible
- Verify HTTPS (required in production)
- Test with `curl -X POST https://your-domain.com/api/webhooks/clerk`

**Check Clerk Dashboard:**
- Go to Webhooks > Your Endpoint
- Click on **Events** tab
- Check delivery status
- View request/response logs

### Webhook signature verification fails

**Ensure environment variable is set:**
```bash
# Check if CLERK_WEBHOOK_SECRET is set
echo $CLERK_WEBHOOK_SECRET

# Should output: whsec_xxxxxxxxxxxxx
```

**Check server logs:**
- Look for "Clerk webhook verification failed" errors
- Verify signing secret matches Clerk Dashboard

### Stripe customer not created

**Check application logs:**
- Look for errors in `StripeCustomerService.createCustomer`
- Verify `STRIPE_SECRET_KEY` is set correctly

**Check Clerk user:**
- Verify user has email address
- Check `user.email_addresses` in webhook payload

### Metadata not updating

**Verify Clerk SDK version:**
```json
// package.json
"@clerk/backend": "^latest"
```

**Check permissions:**
- Ensure Clerk secret key has permission to update metadata

## Security Best Practices

### 1. Always verify webhook signatures

```typescript
// ✅ DO: Verify signature
const wh = new Webhook(webhookSecret);
const event = wh.verify(payload, headers);

// ❌ DON'T: Skip verification
const event = JSON.parse(payload);
```

### 2. Use HTTPS in production

Webhook endpoints must use HTTPS to prevent man-in-the-middle attacks.

### 3. Keep signing secrets secure

- Store in environment variables
- Never commit to version control
- Rotate periodically

### 4. Validate webhook data

```typescript
// Verify required fields exist
if (!email || !userId) {
  return c.json({ error: 'Missing required fields' }, 400);
}
```

## Environment Variables Summary

```bash
# Clerk Configuration
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxx"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"

# Stripe Configuration (for reference)
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

## Webhook Events Reference

### user.created

Triggered when a user is created in Clerk.

**Payload:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_xxxxx",
    "email_addresses": [
      { "email_address": "user@example.com" }
    ],
    "first_name": "João",
    "last_name": "Silva"
  }
}
```

### user.deleted

Triggered when a user is deleted from Clerk.

**Payload:**
```json
{
  "type": "user.deleted",
  "data": {
    "id": "user_xxxxx"
  }
}
```

## Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- [LGPD Compliance](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
