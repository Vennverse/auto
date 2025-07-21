# AutoJobr - AI-Powered Job Platform

## Project Overview
AutoJobr is a comprehensive AI-powered job platform serving both job seekers and recruiters. The platform includes features like resume analysis, mock interviews, coding tests, job matching, and premium subscription services.

## Current Status
✅ **Migration Complete** - Successfully migrated from Replit Agent to full Replit environment
- Application running on port 5000
- Database connection established
- Authentication system working
- Both job seeker and recruiter flows functional

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with email verification
- **AI Services**: GROQ API for AI functionality
- **Payment**: PayPal and Stripe integration

## User Types
1. **Job Seekers**: Resume analysis, mock interviews, test taking, job discovery
2. **Recruiters**: Job posting, candidate management, test creation, interview scheduling

## Recent Changes (January 21, 2025)
- ✅ Fixed package dependencies and TypeScript compilation
- ✅ Configured database connection with PostgreSQL
- ✅ Set up GROQ API integration for AI features
- ✅ Enhanced `/api/user` endpoint to return complete user data
- ✅ Fixed authentication middleware for proper session handling
- ✅ Verified recruiter and job seeker routing works correctly
- ✅ Fixed recruiter routing to redirect to recruiter dashboard instead of /post-job
- ✅ Added dual dashboard access for recruiters (recruiter + user dashboards)
- ✅ Enhanced RecruiterNavbar with navigation between recruiter and user views
- ✅ Unified authentication flow for all recruiters
- ✅ Implemented automatic user type detection based on company email domains
- ✅ Auto-upgrade existing job_seekers with company emails to recruiter status
- ✅ Added company name extraction from email domains

## Key Features
- Resume upload and ATS optimization
- AI-powered mock interviews
- Coding test platform
- Job recommendation engine
- Real-time messaging system
- Premium subscription tiers
- Chrome extension integration

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - For AI functionality
- `STRIPE_SECRET_KEY` - Payment processing (optional)
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET` - PayPal payments (optional)
- `RESEND_API_KEY` - Email service (optional)

## User Preferences
- User is technical and prefers detailed explanations
- Focus on security and robust architecture
- Maintain separation between client and server