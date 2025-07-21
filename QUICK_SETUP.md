# AutoJobr Quick Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL Database** (Neon, Supabase, or PlanetScale)
3. **Groq API Key** for AI features

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string (starts with `postgresql://`)

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database and copy the connection string

### Option C: PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get the connection string from the Connect tab

## Step 2: Quick Installation

```bash
# Clone or download the project
cd autojobr

# Run the setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
cp .env.example .env
npm install
```

## Step 3: Configure Environment

Edit the `.env` file with your credentials:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Session Secret (Required) - Generate a random 32+ character string
SESSION_SECRET=your-super-secret-session-key-at-least-32-characters-long

# AI Service (Required for job analysis)
GROQ_API_KEY=your-groq-api-key-from-groq.com

# Development settings
NODE_ENV=development
REPLIT_DOMAINS=localhost:5000,127.0.0.1:5000
```

## Step 4: Initialize Database

```bash
# Push database schema
npm run db:push
```

## Step 5: Start the Application

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

## Step 6: Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The AutoJobr extension should now appear in your browser

## Getting API Keys

### Groq API Key (Required for AI features)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create an API key
3. Add it to your `.env` file as `GROQ_API_KEY`

### PayPal Integration (Optional)
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Create an app and get client ID and secret
3. Add to `.env` file

### Stripe Integration (Optional)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your API keys
3. Add to `.env` file

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is correct
- Check if your database allows external connections
- For Neon: Make sure the database is not sleeping

### Chrome Extension Issues
- Extension not loading: Check if developer mode is enabled
- Forms not filling: Make sure you're logged into the web app
- Site blocking: The extension uses stealth mode to avoid detection

### Common Fixes

```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Reset database
npm run db:push

# Check environment variables
cat .env
```

## Features Overview

### Web Application
- User authentication and profile management
- Job application tracking
- AI-powered job analysis
- Premium subscription with PayPal
- Resume analysis and optimization

### Chrome Extension
- Intelligent form detection across 40+ job sites
- Automatic form filling with your profile data
- Real-time job matching analysis
- Usage tracking with daily limits
- Support for Workday, LinkedIn, Greenhouse, Lever, and more

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database connection is working
4. Test with a different browser if needed

The application is now ready to use! Visit `http://localhost:5000` to get started.