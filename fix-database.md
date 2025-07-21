# Fix Database Connection Error

You're seeing the error because Replit's database is having issues. Here's how to fix it:

## Quick Fix (5 minutes)

### Step 1: Get a Free Database

**Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://username:password@host/database`)

**Option B: Supabase**
1. Go to https://supabase.com
2. Create account and new project
3. Go to Settings > Database
4. Copy the connection string

### Step 2: Update Your Environment

Create/edit `.env` file in your project root:

```env
# Replace this with your actual database connection string
DATABASE_URL=postgresql://username:password@your-host:5432/your-database

# Add a session secret (any random string)
SESSION_SECRET=your-random-secret-key-32-characters-long

# Optional: Add Groq API key for AI features
GROQ_API_KEY=your-groq-api-key
```

### Step 3: Restart the Application

```bash
# Install dependencies (if not done)
npm install

# Setup database tables
npm run db:push

# Start the app
npm run dev
```

## Why This Happened

Replit's database service is experiencing issues ("endpoint is disabled"). Using external databases like Neon or Supabase is more reliable and gives you:

- Better performance
- No connection limits
- Free tier available
- Works anywhere (not just Replit)

## Test It's Working

After setup, you should see:
- ✅ Database connected successfully
- ✅ Using PostgreSQL session store
- No more "Control plane request failed" errors

The app will then work properly at http://localhost:5000