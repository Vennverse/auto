# Quick Deploy Guide for AutoJobr

## 🚀 One-Click Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- 4GB+ RAM available
- Your API keys ready

### Step 1: Quick Setup
```bash
# Clone the repository
git clone https://github.com/your-username/autojobr.git
cd autojobr

# Copy environment template
cp .env.docker .env.production

# Edit with your API keys
nano .env.production
```

### Step 2: Deploy with Script
```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh -e production -d your-domain.com -m your-email@domain.com

# Or deploy without SSL for testing
./deploy.sh -e production -s
```

### Step 3: Access Your Application
- **Application**: http://localhost:5000
- **Database**: localhost:5432
- **Monitoring**: http://localhost:3000 (Grafana)

## 💻 Manual Docker Deployment

### Basic Setup
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Production Setup
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# Monitor health
curl http://localhost:5000/api/health
```

## ☁️ Cloud Deployment Options

### AWS Quick Deploy
```bash
# Launch EC2 instance (t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx

# SSH to instance and run deployment
ssh -i your-key.pem ubuntu@your-instance-ip
```

### Google Cloud Run
```bash
# Build and push image
gcloud builds submit --tag gcr.io/your-project/autojobr

# Deploy to Cloud Run
gcloud run deploy autojobr \
  --image gcr.io/your-project/autojobr \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean Droplet
```bash
# Create droplet (4GB RAM minimum)
doctl compute droplet create autojobr \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --ssh-keys your-key-id

# Deploy via SSH
ssh root@your-droplet-ip
```

## 🔧 Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# APIs
GROQ_API_KEY=your_groq_key
STRIPE_SECRET_KEY=your_stripe_key
RESEND_API_KEY=your_resend_key
NEXTAUTH_SECRET=your_32_char_secret
```

### Optional Environment Variables
```bash
# PayPal (if using)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

## 📊 Resource Requirements by Scale

### Small Scale (< 1000 users)
- **Server**: 2 vCPU, 4GB RAM, 20GB SSD
- **Database**: 1 vCPU, 2GB RAM, 10GB SSD
- **Cost**: $20-40/month

### Medium Scale (1000-10000 users)
- **Server**: 4 vCPU, 8GB RAM, 50GB SSD
- **Database**: 2 vCPU, 4GB RAM, 20GB SSD
- **Cost**: $80-150/month

### Large Scale (10000+ users)
- **Server**: 8 vCPU, 16GB RAM, 100GB SSD
- **Database**: 4 vCPU, 8GB RAM, 50GB SSD
- **Load Balancer**: Required
- **Cost**: $200-500/month

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```bash
# Check application health
curl http://localhost:5000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Monitoring URLs
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Application**: http://localhost:5000

### Key Metrics to Monitor
- **CPU Usage**: < 80%
- **Memory Usage**: < 80%
- **Database Connections**: < 80 (out of 100)
- **Response Time**: < 500ms
- **Error Rate**: < 1%

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Common fixes
docker-compose down && docker-compose up -d
docker system prune -a
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U autojobr -d autojobr

# Reset database
docker-compose exec postgres psql -U autojobr -d autojobr -c "SELECT 1;"
```

#### Memory Issues
```bash
# Check container memory usage
docker stats

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

#### SSL Certificate Issues
```bash
# Manual certificate generation
sudo certbot --nginx -d your-domain.com

# Check certificate status
sudo certbot certificates
```

## 📚 Additional Resources

### Performance Optimization
- Enable Redis caching
- Use CDN for static assets
- Implement database connection pooling
- Set up proper logging

### Security Best Practices
- Use strong passwords
- Enable HTTPS
- Configure firewall rules
- Regular security updates

### Backup Strategy
- Database backups every 6 hours
- File uploads backup daily
- Configuration backup weekly
- Test restore procedures monthly

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Maintenance
```bash
# Run database migrations
docker-compose exec app npm run db:push

# Backup database
docker-compose exec postgres pg_dump -U autojobr autojobr > backup.sql

# Restore database
docker-compose exec postgres psql -U autojobr autojobr < backup.sql
```

## 💡 Pro Tips

1. **Use environment-specific configurations** for different stages
2. **Set up monitoring alerts** for critical metrics
3. **Implement proper logging** for debugging
4. **Use secrets management** for sensitive data
5. **Regular backups** are essential
6. **Load testing** before production deployment
7. **SSL certificates** should auto-renew
8. **Database connection pooling** improves performance

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Verify environment variables
3. Ensure all services are running
4. Check network connectivity
5. Review resource usage

For advanced configurations, refer to the complete [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).