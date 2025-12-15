# Stripe Setup Instructions

This guide will walk you through setting up Stripe payments for your scoreboard application.

## Prerequisites

- A Stripe account (sign up at https://stripe.com if you don't have one)
- Your Next.js application running locally

## Step 1: Install Dependencies

First, install the Stripe package:

```bash
npm install
```

The `stripe` package has already been added to your `package.json`.

## Step 2: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_...`)
5. Click **Reveal test key** and copy your **Secret key** (starts with `sk_test_...`)

## Step 3: Create Products and Prices in Stripe

You need to create 5 products/prices in Stripe:

### Standard Plan - Monthly
1. Go to **Products** → **Add product**
2. Name: `Standard Plan - Monthly`
3. Description: `Standard plan billed monthly`
4. Pricing: **Recurring** → **Monthly** → `$20.00`
5. Copy the **Price ID** (starts with `price_...`)

### Standard Plan - Annual
1. Go to **Products** → **Add product**
2. Name: `Standard Plan - Annual`
3. Description: `Standard plan billed annually`
4. Pricing: **Recurring** → **Yearly** → `$120.00` (or `$10.00/month` if Stripe shows monthly equivalent)
5. Copy the **Price ID**

### Pro Plan - Monthly
1. Go to **Products** → **Add product**
2. Name: `Pro Plan - Monthly`
3. Description: `Pro plan billed monthly`
4. Pricing: **Recurring** → **Monthly** → `$40.00`
5. Copy the **Price ID**

### Pro Plan - Annual
1. Go to **Products** → **Add product**
2. Name: `Pro Plan - Annual`
3. Description: `Pro plan billed annually`
4. Pricing: **Recurring** → **Yearly** → `$240.00` (or `$20.00/month` if Stripe shows monthly equivalent)
5. Copy the **Price ID**

### Lifetime Deal
1. Go to **Products** → **Add product**
2. Name: `Lifetime Deal`
3. Description: `One-time payment for lifetime Pro access`
4. Pricing: **One time** → `$100.00`
5. Copy the **Price ID**

## Step 4: Set Up Webhook Endpoint

### For Local Development (using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_...`) that appears in the terminal

### For Production:

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. Click on your endpoint → **Signing secret** → **Reveal** → Copy the secret (starts with `whsec_...`)

## Step 5: Configure Environment Variables

1. Copy `.env-sample` to `.env.local`:
   ```bash
   cp .env-sample .env.local
   ```

2. Fill in all the Stripe-related variables in `.env.local`:

```bash
# Supabase Service Role Key (required for webhooks)
# Get this from: Supabase Dashboard -> Project Settings -> API -> Service Role Key
# ⚠️ NEVER expose this to the client - it bypasses Row Level Security!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (Server-side)
STRIPE_PRICE_STANDARD_MONTHLY=price_1SefkEDHmD3n7Xrye3uRuJiJ
STRIPE_PRICE_STANDARD_ANNUAL=price_1Sefq3DHmD3n7Xry0IV6r889
STRIPE_PRICE_PRO_MONTHLY=price_1Sefm1DHmD3n7Xry6HKjH70q
STRIPE_PRICE_PRO_ANNUAL=price_1SefqyDHmD3n7XrylEigpW14
STRIPE_PRICE_LIFETIME=price_1SeSElDHmD3n7XryC6QWxt79


# Stripe Price IDs (Client-side - same values as above)
NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY=price_1SefkEDHmD3n7Xrye3uRuJiJ
NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL=price_1Sefq3DHmD3n7Xry0IV6r889
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1Sefm1DHmD3n7Xry6HKjH70q
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_1SefqyDHmD3n7XrylEigpW14
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME=price_1SeSElDHmD3n7XryC6QWxt79


## Step 6: Get Supabase Service Role Key

For webhooks to work, you need the Supabase Service Role Key:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **API**
4. Find **Service Role Key** (under "Project API keys")
5. Click **Reveal** and copy the key
6. Add it to your `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: The Service Role Key bypasses Row Level Security (RLS). Never expose it to the client or commit it to version control. It's only used server-side for webhook processing.

## Step 7: Database Setup

Make sure your Supabase `profiles` table has the following column:
- `stripe_customer_id` (TEXT, nullable) - Used to link Stripe customers to users

The subscription information is stored in the `subscriptions` table, which should have:
- `user_id` (UUID, foreign key to profiles.id)
- `stripe_customer_id` (TEXT, nullable)
- `stripe_subscription_id` (TEXT, nullable)
- `stripe_price_id` (TEXT, nullable)
- `status` (TEXT, nullable) - Stripe subscription status (e.g., 'active', 'inactive', 'canceled')
- `plan_type` (TEXT, nullable) - The tier the user paid for ('standard', 'pro', 'lifetime')
- `current_period_start` (TIMESTAMPTZ, nullable)
- `current_period_end` (TIMESTAMPTZ, nullable)
- `cancel_at_period_end` (BOOLEAN, default: false)
- `created_at` (TIMESTAMPTZ, default: now())
- `updated_at` (TIMESTAMPTZ, default: now())

The `subscriptions` table is linked to `profiles` via the `user_id` foreign key. All subscription information is managed through this table.

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Start Stripe webhook forwarding (if testing locally):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Navigate to `/pricing` in your app
4. Click on a paid plan (Standard, Pro, or Lifetime)
5. You should be redirected to Stripe Checkout
6. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Step 9: Production Setup

When you're ready for production:

1. Switch Stripe Dashboard to **Live mode**
2. Create the same products/prices in Live mode
3. Get your Live API keys from **Developers** → **API keys**
4. Set up the webhook endpoint for your production domain
5. Update `.env.local` (or your hosting platform's environment variables) with:
   - Live API keys (replace `sk_test_` with `sk_live_` and `pk_test_` with `pk_live_`)
   - Live price IDs
   - Production webhook secret
   - Production `NEXT_PUBLIC_SITE_URL`

## Troubleshooting

### Checkout button doesn't work
- Check browser console for errors
- Verify all `NEXT_PUBLIC_STRIPE_PRICE_*` environment variables are set
- Make sure you're logged in (checkout requires authentication)

### Webhook errors
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- For local testing, make sure Stripe CLI is running and forwarding webhooks
- Check server logs for webhook processing errors

### Price ID errors
- Make sure you're using **Price IDs** (starts with `price_`) not Product IDs (starts with `prod_`)
- Verify price IDs match between server and client environment variables
- Check that prices are active in Stripe Dashboard

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Check your server logs and browser console for detailed error messages
