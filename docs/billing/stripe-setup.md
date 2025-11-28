# Stripe Configuration Guide

This guide will walk you through setting up Stripe for the AegisWallet billing system.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Environment variables configured

## Step 1: Create Products and Prices

### 1.1 Create Products

Go to **Products** in Stripe Dashboard and create two products:

**Product 1: AegisWallet Básico**
- Name: `AegisWallet Básico`
- Description: `Chat IA e automações básicas`
- Price: R$ 59,00/mês

**Product 2: AegisWallet Avançado**
- Name: `AegisWallet Avançado`
- Description: `Todos os modelos de IA e recursos premium`
- Price: R$ 119,00/mês

### 1.2 Get Price IDs

After creating the products, copy the Price IDs. They look like `price_xxxxxxxxxxxxx`.

Add them to your `.env` file:

```bash
STRIPE_PRICE_BASIC_MONTHLY="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ADVANCED_MONTHLY="price_xxxxxxxxxxxxx"
```

## Step 2: Get API Keys

Go to **Developers > API keys** in Stripe Dashboard.

Copy the **Secret key** and **Publishable key**:

```bash
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"  # Use sk_live_ in production
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"  # Use pk_live_ in production
```

## Step 3: Configure Webhooks

### 3.1 Create Webhook Endpoint

Go to **Developers > Webhooks** and click **Add endpoint**.

**Endpoint URL:**
- Development: `https://your-domain.com/api/v1/billing/webhook`
- Use `stripe listen` for local testing (see below)

**Events to listen for:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### 3.2 Get Webhook Secret

After creating the webhook, copy the **Signing secret**:

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

## Step 4: Configure URLs

Set the redirect URLs in your `.env`:

```bash
STRIPE_SUCCESS_URL="https://app.aegiswallet.com.br/billing/success"
STRIPE_CANCEL_URL="https://app.aegiswallet.com.br/billing/cancel"
STRIPE_PORTAL_RETURN_URL="https://app.aegiswallet.com.br/settings/billing"
```

## Step 5: Enable Customer Portal

Go to **Settings > Billing > Customer portal**.

Enable the following features:
- ✅ Invoice history
- ✅ Update payment method
- ✅ Update billing information
- ✅ Cancel subscription

## Step 6: Local Development with Stripe CLI

Install Stripe CLI:
```bash
# Windows (Scoop)
scoop install stripe

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/v1/billing/webhook
```

This will give you a webhook secret for local development. Add it to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

## Step 7: Test Checkout

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

## Step 8: Seed Subscription Plans

Run the seed script to populate plans in the database:

```bash
bun scripts/seed-subscription-plans.ts
```

## Verification Checklist

- [ ] Products created in Stripe Dashboard
- [ ] Price IDs added to `.env`
- [ ] API keys configured
- [ ] Webhook endpoint created and secret added
- [ ] Customer portal enabled
- [ ] URLs configured
- [ ] Subscription plans seeded in database
- [ ] Test checkout works with test card

## Going to Production

1. **Replace test keys with live keys:**
   - Replace `sk_test_` with `sk_live_`
   - Replace `pk_test_` with `pk_live_`

2. **Update webhook endpoint:**
   - Point to production URL
   - Update webhook secret

3. **Update URLs:**
   - Change to production domain

4. **Enable live mode in Stripe Dashboard**

5. **Test with real payment:**
   - Use real card to verify
   - Check webhook delivery
   - Verify subscription creation

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard > Webhooks > Events for delivery status
- Use `stripe listen` for local testing

### Checkout session fails
- Verify price IDs are correct
- Check Stripe logs in Dashboard
- Ensure customer exists in Stripe

### Subscription not activating
- Check webhook events are being received
- Verify database updates in `subscriptions` table
- Check application logs

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhook Events](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
