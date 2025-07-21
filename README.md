# AutoBR - AI-Powered Job Application Platform

AutoBR is a comprehensive job application platform that connects job seekers with recruiters, featuring AI-powered resume analysis, job matching, virtual interviews, and Chrome extension for automated job applications.

## Features

- 🤖 **AI-Powered Resume Analysis** - Get ATS scores and optimization suggestions
- 🎯 **Smart Job Matching** - Find jobs that match your skills and experience  
- 📝 **Automated Job Applications** - Chrome extension for one-click applications
- 💬 **Virtual Interviews** - AI-conducted interviews with behavioral analysis
- 🏢 **Recruiter Dashboard** - Manage job postings and candidate applications
- 💳 **Payment Integration** - Stripe and PayPal for premium features
- 📊 **Analytics & Insights** - Track application success rates

## Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# 1. Set environment variables
export POSTGRES_PASSWORD='your_secure_password'
export NEXTAUTH_SECRET='your_32_character_secret_key_here'
export GROQ_API_KEY='your_groq_api_key'
export RESEND_API_KEY='your_resend_api_key'
export DOMAIN='your-domain.com'
export NEXTAUTH_URL='https://your-domain.com'

# 2. Run deployment script
./docker-deploy.sh
```

### Option 2: Direct Linux VM Deployment

```bash
# 1. Set environment variables
export POSTGRES_PASSWORD='your_secure_password'
export NEXTAUTH_SECRET='your_32_character_secret_key_here'
export GROQ_API_KEY='your_groq_api_key'
export RESEND_API_KEY='your_resend_api_key'
export DOMAIN='your-domain.com'
export NEXTAUTH_URL='https://your-domain.com'

# 2. Run deployment script
./deploy.sh
```

## System Requirements

- **Minimum**: 4GB RAM, 2 vCPU, 50GB disk space
- **Recommended**: 8GB RAM, 4 vCPU, 100GB disk space
- **OS**: Ubuntu 22.04+ (other Linux distributions may work)

## Required API Keys

### Essential APIs
1. **Groq API Key** (AI features): Get from [Groq Console](https://console.groq.com/)
2. **Resend API Key** (email notifications): Get from [Resend](https://resend.com/)

### Optional APIs
1. **Stripe** (payments): Get from [Stripe Dashboard](https://stripe.com/)
2. **PayPal** (payments): Get from [PayPal Developer](https://developer.paypal.com/)

## Manual Installation

If you prefer manual setup, see the detailed guides:

- [Linux VM Deployment Guide](./LINUX_VM_DEPLOYMENT.md) - Complete manual setup guide
- [Docker Deployment](./docker-compose.prod.yml) - Production Docker configuration

## Development

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start development server
npm run dev
```

### Database Setup

```bash
# Push schema to database
npm run db:push
```

## Architecture

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth
- **AI Integration**: Groq SDK
- **Payment**: Stripe + PayPal integration

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query

### Chrome Extension
- Automated form filling for 1000+ job boards
- Real-time job analysis and matching
- Cover letter generation
- Application tracking

## Management Commands

### Docker Deployment
```bash
# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down
```

### Direct Deployment
```bash
# Check application status
pm2 status

# View logs
pm2 logs autobr

# Restart application
pm2 restart autobr

# Monitor resources
htop
```

## Security Features

- HTTPS with Let's Encrypt SSL certificates
- Rate limiting and DDoS protection
- Secure file upload handling
- Input validation and sanitization
- Session-based authentication
- Firewall configuration

## Backup & Monitoring

- Automated daily database backups
- Application file backups
- Health check endpoints
- System monitoring scripts
- Log rotation and management

## Support & Documentation

- [Deployment Guide](./LINUX_VM_DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](./server/routes.ts) - Backend API endpoints
- [Database Schema](./shared/schema.ts) - Complete data model

## Demo Users

- **Job Seeker**: demo.alexandra.chen@example.com / demo123
- **Recruiter**: Use any recruiter account or create new account

## License

MIT License - See LICENSE file for details

---

**Need Help?** 
- Check the [deployment guide](./LINUX_VM_DEPLOYMENT.md) for detailed instructions
- Review system logs for troubleshooting
- Ensure all required API keys are configured