# AutoJobr Docker Deployment Guide

This guide provides comprehensive instructions for deploying AutoJobr using Docker in both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ available disk space

## Quick Start

### Development Environment

1. **Clone and Setup**
```bash
git clone <your-repo>
cd autojobr
cp .env.example .env
```

2. **Configure Environment Variables**
Edit `.env` with your API keys:
```bash
# Required for basic functionality
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/autojobr
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GROQ_API_KEY=your-groq-api-key
RESEND_API_KEY=your-resend-api-key

# Payment processing (optional for development)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_PRICE_ID=price_your-price-id
```

3. **Start Development Environment**
```bash
docker-compose up -d
```

4. **Initialize Database**
```bash
docker-compose exec app npm run db:push
```

5. **Access Application**
- Web App: http://localhost:5000
- Database: localhost:5432
- Redis: localhost:6379

### Production Environment

1. **Prepare Production Environment**
```bash
cp .env.example .env.production
```

2. **Configure Production Variables**
```bash
# Production Database
DATABASE_URL=postgresql://username:password@your-db-host:5432/autojobr

# Security
SESSION_SECRET=your-secure-session-secret-32-chars-min
JWT_SECRET=your-secure-jwt-secret-32-chars-min

# Domain Configuration
DOMAIN=your-domain.com
SSL_ENABLED=true

# Production API Keys
STRIPE_SECRET_KEY=sk_live_your-live-stripe-key
PAYPAL_CLIENT_ID=your-live-paypal-client-id
# ... other production keys
```

3. **Deploy Production Stack**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture Overview

### Development Stack
- **App Container**: Node.js application with hot reload
- **PostgreSQL**: Database with persistent storage
- **Redis**: Session storage and caching
- **Volumes**: Code mounting for development

### Production Stack
- **App Container**: Optimized production build
- **PostgreSQL**: Production database with backups
- **Redis**: Persistent session storage
- **Nginx**: Reverse proxy with SSL and rate limiting
- **Health Checks**: Automated service monitoring

## Container Details

### Application Container

**Development Features:**
- Hot reload for code changes
- Volume mounting for live development
- Debug ports exposed
- Development logging

**Production Features:**
- Multi-stage build optimization
- Non-root user security
- Health checks
- Restart policies
- Resource limits

### Database Container

**Configuration:**
- PostgreSQL 16 with Alpine base
- Persistent data volumes
- Health checks
- Connection pooling ready

**Backup Strategy:**
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres autojobr > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres autojobr < backup.sql
```

### Redis Container

**Features:**
- Session storage
- Cache management
- Persistent data (optional)
- Health monitoring

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Yes |
| `GROQ_API_KEY` | AI analysis service key | Yes |
| `RESEND_API_KEY` | Email service key | Yes |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Payment processing | None |
| `PAYPAL_CLIENT_ID` | Alternative payment | None |
| `RAZORPAY_KEY_ID` | India payment processing | None |
| `SESSION_SECRET` | Session encryption | Generated |
| `REDIS_URL` | Redis connection | redis://redis:6379 |

## Deployment Commands

### Development Workflow

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Restart application only
docker-compose restart app

# Update dependencies
docker-compose exec app npm install

# Run database migrations
docker-compose exec app npm run db:push

# Shell access
docker-compose exec app sh
```

### Production Workflow

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# Update application
docker-compose -f docker-compose.prod.yml pull app
docker-compose -f docker-compose.prod.yml up -d app

# Monitor services
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres autojobr > backup.sql
```

## SSL Configuration

### Using Let's Encrypt

1. **Install Certbot**
```bash
sudo apt-get install certbot
```

2. **Generate Certificates**
```bash
sudo certbot certonly --standalone -d your-domain.com
```

3. **Update Nginx Configuration**
```bash
# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
```

4. **Enable SSL in nginx.conf**
Uncomment the SSL server block and update domain name.

## Monitoring and Logs

### Health Checks

All services include health checks:
- **App**: HTTP endpoint check
- **PostgreSQL**: Connection test
- **Redis**: Ping test

### Log Management

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f app

# Export logs
docker-compose logs --no-color > autojobr.log
```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Service status
docker-compose ps
```

## Troubleshooting

### Common Issues

**Container Won't Start**
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose config
```

**Database Connection Issues**
```bash
# Test database connectivity
docker-compose exec app psql $DATABASE_URL -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d
```

**Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 uploads/
```

### Performance Issues

**High Memory Usage**
- Increase Docker memory limits
- Optimize Node.js memory settings
- Enable Redis memory optimization

**Slow Database Queries**
- Add database indices
- Enable query logging
- Use connection pooling

## Security Considerations

### Production Security

1. **Environment Variables**
   - Use strong, unique secrets
   - Rotate keys regularly
   - Never commit secrets to git

2. **Network Security**
   - Use internal Docker networks
   - Limit exposed ports
   - Enable Nginx rate limiting

3. **Container Security**
   - Run as non-root user
   - Use minimal base images
   - Regular security updates

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres autojobr > "backup_${DATE}.sql"
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  app:
    deploy:
      replicas: 3
  nginx:
    depends_on:
      - app
```

### Load Balancing

Configure Nginx upstream with multiple app instances:
```nginx
upstream app {
    server app_1:5000;
    server app_2:5000;
    server app_3:5000;
}
```

## Migration from Replit

### Data Export

1. **Export Database**
```bash
# From Replit
pg_dump $DATABASE_URL > replit_backup.sql
```

2. **Transfer Files**
```bash
# Download from Replit
# Upload to your server
```

3. **Import to Docker**
```bash
# Import database
docker-compose exec -T postgres psql -U postgres autojobr < replit_backup.sql

# Copy uploaded files
docker cp uploads/ autojobr-app:/app/uploads/
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test health endpoints: `curl http://localhost:5000/health`
4. Review environment variables
5. Check resource availability