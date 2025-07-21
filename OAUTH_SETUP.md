# OAuth Setup Guide for AutoJobr

## Quick Start - Demo Login
The demo login works immediately without any setup. Just click "Continue with Demo Account" to access all features.

## Adding OAuth Providers

To enable social login (Google, GitHub, LinkedIn), you need to add API keys to your environment. Here's how:

### 1. Create a `.env` file (if it doesn't exist)
```bash
# Copy the example file
cp .env.example .env
```

### 2. Add OAuth Keys to `.env`

Open the `.env` file and add your OAuth credentials:

```env
# Session secret (required)
NEXTAUTH_SECRET=your-random-secret-key-at-least-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Payment Systems
# Stripe (for one-time payments and subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_PRICE_ID=price_your_subscription_price_id

# PayPal (for subscriptions)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 3. Getting OAuth Credentials

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add redirect URI: `http://localhost:5000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the form:
   - Application name: `AutoJobr`
   - Homepage URL: `http://localhost:5000`
   - Authorization callback URL: `http://localhost:5000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env` file

#### LinkedIn OAuth Setup
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information
4. In "Auth" tab, add redirect URL: `http://localhost:5000/api/auth/callback/linkedin`
5. Copy the Client ID and Client Secret to your `.env` file

### 4. Restart the Application
After adding the keys, restart the server:
```bash
# The workflow will restart automatically
```

### 5. Test OAuth Login
Once configured, the social login buttons will become functional and the "Setup Required" labels will disappear.

## Current Status
- ✅ Demo login works immediately
- ✅ Session management working
- ⏳ OAuth providers require setup (optional)
- ✅ All features available with demo account

## Payment System Setup

### Stripe Setup (for subscriptions and one-time payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Get your API keys:
   - `STRIPE_SECRET_KEY` - Secret key (starts with `sk_test_` or `sk_live_`)
   - `VITE_STRIPE_PUBLIC_KEY` - Publishable key (starts with `pk_test_` or `pk_live_`)
3. Create a subscription product:
   - Go to [Products](https://dashboard.stripe.com/products)
   - Create a new product for your premium plan
   - Copy the Price ID (`STRIPE_PRICE_ID`)

### PayPal Setup (for alternative payment method)
1. Go to [PayPal Developer](https://developer.paypal.com/developer/applications/)
2. Create a new app
3. Copy your credentials:
   - `PAYPAL_CLIENT_ID` - Client ID
   - `PAYPAL_CLIENT_SECRET` - Secret

## Production Deployment
For production deployment on other platforms:
1. Update redirect URIs to your production domain
2. Set `NODE_ENV=production` 
3. Use secure session secrets
4. Enable HTTPS for OAuth providers
5. Use live payment keys instead of test keys

The system is designed to work seamlessly across different hosting platforms.