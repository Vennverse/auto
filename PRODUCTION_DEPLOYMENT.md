# AutoJobr Production Deployment Guide

## Required Changes for Production

### 1. Database Configuration

**Current**: Replit PostgreSQL database (development only)
**Production**: External PostgreSQL database required

**Environment Variables to Set**:
```bash
# Production Database (choose one provider)
DATABASE_URL=postgresql://user:password@host:port/database

# For Neon (recommended)
DATABASE_URL=postgresql://username:password@ep-example.us-west-2.aws.neon.tech/neondb?sslmode=require

# For Supabase
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# For Railway
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

**Database Migration**:
```bash
npm run db:push  # Will automatically create tables in production database
```

### 2. Environment Variables

**Required for Production**:
```bash
# Core Configuration
NODE_ENV=production
DATABASE_URL=your-production-database-url

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-at-least-32-characters-long
NEXTAUTH_URL=https://your-deployed-domain.com

# AI Service (Required)
GROQ_API_KEY=your-groq-api-key

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Payment Processing (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### 3. Chrome Extension Configuration

**Update Required Files**:

**extension/background.js** (Line 13-16):
```javascript
const possibleUrls = [
  'https://your-production-domain.com',  // Add your production URL
  'https://60e68a76-86c4-4eef-b2f5-8a97de774d09-00-f9a0u7nh8k0p.kirk.replit.dev',
  'http://localhost:5000'
];
```

**extension/config.js** (Line 4-7):
```javascript
this.possibleUrls = [
  'https://your-production-domain.com',  // Add your production URL
  'https://60e68a76-86c4-4eef-b2f5-8a97de774d09-00-f9a0u7nh8k0p.kirk.replit.dev',
  'http://localhost:5000'
];
```

### 4. CORS Configuration

**server/index.ts** - Update CORS settings:
```javascript
app.use(cors({
  origin: [
    'https://your-production-domain.com',
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));
```

### 5. Database Setup Steps

1. **Create Production Database**:
   - Sign up for Neon, Supabase, or Railway
   - Create new PostgreSQL database
   - Copy connection string

2. **Set Environment Variable**:
   ```bash
   DATABASE_URL=your-production-connection-string
   ```

3. **Run Migration**:
   ```bash
   npm run db:push
   ```

### 6. Deployment Platforms

**Recommended Platforms**:

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel --prod
```
- Set environment variables in Vercel dashboard
- Automatic HTTPS and CDN
- Zero configuration needed

**Railway**:
```bash
npm install -g @railway/cli
railway login
railway deploy
```
- Includes database option
- Simple environment variable management

**Replit Deployments**:
- Use existing Replit setup
- Add production environment variables
- Deploy from Replit interface

### 7. SSL/HTTPS Requirements

**Chrome Extension Requirements**:
- Production domain MUST use HTTPS
- Self-signed certificates won't work
- Use platforms like Vercel for automatic SSL

### 8. Pre-Deployment Checklist

**Database**:
- [ ] Production PostgreSQL database created
- [ ] DATABASE_URL environment variable set
- [ ] Database migration completed (`npm run db:push`)

**Environment Variables**:
- [ ] All required environment variables set
- [ ] GROQ_API_KEY configured
- [ ] NEXTAUTH_SECRET set (32+ characters)
- [ ] Production domain in NEXTAUTH_URL

**Chrome Extension**:
- [ ] Production URL added to extension configuration
- [ ] Extension files updated with production domain
- [ ] CORS settings include production domain

**Payment Integration** (Optional but recommended):
- [ ] Stripe configured for credit card payments
- [ ] PayPal configured for PayPal payments  
- [ ] Razorpay configured for Indian market payments
- [ ] All payment webhook secrets configured

**File Storage** (Important):
- [ ] Local file storage directory created (/tmp/autojobr-files for production)
- [ ] File compression working correctly
- [ ] Resume upload and download tested
- [ ] Cloud storage configured for scale (AWS S3 recommended)

### 9. Post-Deployment Testing

1. **Web Application**:
   - [ ] Landing page loads
   - [ ] Authentication works
   - [ ] User registration/login
   - [ ] Profile creation
   - [ ] Database operations function

2. **Chrome Extension**:
   - [ ] Extension connects to production API
   - [ ] Profile data syncs correctly
   - [ ] Form auto-filling works on job sites
   - [ ] Job analysis features function

3. **Database**:
   - [ ] User data persists correctly
   - [ ] No foreign key constraint errors
   - [ ] All CRUD operations work

### 10. Environment-Specific Code

The application automatically detects production vs development:

**Database Connection** (`server/db.ts`):
- Development: Uses Replit PostgreSQL
- Production: Uses external PostgreSQL when DATABASE_URL contains 'neon', 'supabase', etc.

**Session Configuration**:
- Development: Secure cookies disabled
- Production: Secure cookies enabled, HTTPS required

### 11. Monitoring and Logs

**Add to Production**:
```javascript
// Error tracking
console.error('Production error:', error);

// Performance monitoring
console.time('Database Query');
// ... database operation
console.timeEnd('Database Query');
```

## Quick Deployment Commands

**For Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add GROQ_API_KEY
vercel env add NEXTAUTH_SECRET
```

**For Railway**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy

# Set environment variables through Railway dashboard
```

## Security Considerations

1. **Never commit** `.env` files to version control
2. **Rotate secrets** regularly in production
3. **Use different database** for production vs development
4. **Enable database SSL** in production
5. **Set secure session cookies** (handled automatically)

## Scaling Considerations

- Database connection pooling (already configured)
- Redis for session storage (upgrade from PostgreSQL sessions)
- CDN for static assets (handled by deployment platform)
- Environment-specific logging levels