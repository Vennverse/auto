# AutoJobr Deployment Guide

## Overview
This guide covers deploying AutoJobr using Docker, Virtual Machines, and Cloud platforms with resource requirements and configuration.

## Resource Requirements

### Minimum Production Requirements
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 1 Gbps bandwidth
- **Database**: PostgreSQL 14+ (separate instance recommended)

### Recommended Production Requirements
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 2 Gbps bandwidth
- **Database**: PostgreSQL 14+ with 2GB RAM dedicated

### High-Load Production Requirements
- **CPU**: 8+ vCPUs
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD
- **Network**: 5 Gbps bandwidth
- **Database**: PostgreSQL cluster with 4GB+ RAM

## 1. Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available

### Step 1: Create Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S autojobr -u 1001

# Change ownership
RUN chown -R autojobr:nodejs /app
USER autojobr

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server/index.js"]
```

### Step 2: Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    networks:
      - autojobr-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=autojobr
      - POSTGRES_USER=autojobr
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - autojobr-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - autojobr-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - autojobr-network

volumes:
  postgres_data:

networks:
  autojobr-network:
    driver: bridge
```

### Step 3: Environment Configuration

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://autojobr:password@postgres:5432/autojobr
GROQ_API_KEY=your_groq_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_SECRET=your_nextauth_secret
POSTGRES_PASSWORD=your_postgres_password
```

### Step 4: Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream autojobr {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://autojobr;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://autojobr/api/health;
        }
    }
}
```

### Step 5: Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale the application
docker-compose up -d --scale app=3

# Stop services
docker-compose down
```

## 2. Virtual Machine Deployment

### Prerequisites
- Ubuntu 22.04 LTS or CentOS 8+
- 4GB+ RAM
- 20GB+ disk space
- SSH access

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE autojobr;
CREATE USER autojobr WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE autojobr TO autojobr;
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: shared_preload_libraries = 'pg_stat_statements'
# Set: max_connections = 100

sudo systemctl restart postgresql
```

### Step 3: Application Deployment

```bash
# Clone repository
git clone https://github.com/your-repo/autojobr.git
cd autojobr

# Install dependencies
npm install

# Build application
npm run build

# Create environment file
cp .env.example .env.production
nano .env.production

# Run database migrations
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 4: PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'autojobr',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

### Step 5: Nginx Configuration

```nginx
# /etc/nginx/sites-available/autojobr
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /static {
        alias /path/to/autojobr/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autojobr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d your-domain.com
```

## 3. Cloud Platform Deployment

### AWS Deployment

#### Option A: AWS EC2 with RDS

**Resources Needed:**
- EC2 t3.medium (2 vCPUs, 4GB RAM) - $30/month
- RDS PostgreSQL db.t3.micro - $15/month
- Application Load Balancer - $20/month
- S3 bucket for file storage - $5/month
- **Total: ~$70/month**

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier autojobr-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username autojobr \
  --master-user-password your-password \
  --allocated-storage 20
```

#### Option B: AWS ECS with Fargate

**Resources Needed:**
- ECS Fargate (0.5 vCPU, 1GB RAM) - $15/month
- Application Load Balancer - $20/month
- RDS PostgreSQL db.t3.micro - $15/month
- **Total: ~$50/month**

```yaml
# docker-compose.yml for ECS
version: '3.8'
services:
  app:
    image: your-registry/autojobr:latest
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment

**Resources Needed:**
- Cloud Run (1 vCPU, 2GB RAM) - $20/month
- Cloud SQL PostgreSQL - $25/month
- Cloud Storage - $5/month
- **Total: ~$50/month**

```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/your-project/autojobr

gcloud run deploy autojobr \
  --image gcr.io/your-project/autojobr \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### GKE Deployment

**Resources Needed:**
- GKE cluster (3 nodes, e2-medium) - $100/month
- Cloud SQL PostgreSQL - $25/month
- Load Balancer - $20/month
- **Total: ~$145/month**

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autojobr-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autojobr
  template:
    metadata:
      labels:
        app: autojobr
    spec:
      containers:
      - name: autojobr
        image: gcr.io/your-project/autojobr:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: autojobr-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### Azure Deployment

#### Azure Container Instances

**Resources Needed:**
- Container Instance (1 vCPU, 2GB RAM) - $25/month
- Azure Database for PostgreSQL - $30/month
- Application Gateway - $25/month
- **Total: ~$80/month**

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group autojobr-rg \
  --name autojobr-container \
  --image your-registry/autojobr:latest \
  --cpu 1 \
  --memory 2 \
  --ports 5000 \
  --environment-variables NODE_ENV=production
```

## 4. Performance Optimization

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_job_postings_recruiter ON job_postings(recruiter_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);

-- Connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

### Caching Strategy

```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Cache job postings
const cacheKey = `jobs:${filters}`;
const cachedJobs = await client.get(cacheKey);
if (cachedJobs) {
  return JSON.parse(cachedJobs);
}
```

### Load Balancing

```nginx
# Nginx load balancing
upstream autojobr_backend {
    least_conn;
    server app1:5000 weight=3;
    server app2:5000 weight=3;
    server app3:5000 weight=2;
}

server {
    listen 80;
    location / {
        proxy_pass http://autojobr_backend;
    }
}
```

## 5. Monitoring and Logging

### Application Monitoring

```javascript
// Add to server/index.js
const express = require('express');
const prometheus = require('prom-client');

// Metrics collection
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
  });
  next();
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### Health Checks

```javascript
// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

## 6. Security Considerations

### SSL/TLS Configuration

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;

# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### Environment Variables

```bash
# Secure environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
GROQ_API_KEY=your_secure_key
STRIPE_SECRET_KEY=sk_live_your_key
RESEND_API_KEY=re_your_key
NEXTAUTH_SECRET=your_32_char_secret
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## 7. Backup and Recovery

### Database Backups

```bash
# Automated PostgreSQL backups
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/autojobr_backup_$DATE.sql"

pg_dump -h localhost -U autojobr -d autojobr > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### Disaster Recovery

```bash
# Restore from backup
gunzip -c /backups/autojobr_backup_20240101_120000.sql.gz | psql -h localhost -U autojobr -d autojobr

# File system backup
rsync -av /app/uploads/ /backups/uploads/
```

## Cost Comparison Summary

| Platform | Configuration | Monthly Cost | Best For |
|----------|---------------|-------------|----------|
| Docker (Self-hosted) | VPS + PostgreSQL | $20-40 | Development/Small scale |
| AWS EC2 + RDS | t3.medium + db.t3.micro | $70 | Full control |
| AWS ECS Fargate | 0.5 vCPU + RDS | $50 | Serverless |
| GCP Cloud Run | 1 vCPU + Cloud SQL | $50 | Auto-scaling |
| Azure Container | 1 vCPU + PostgreSQL | $80 | Enterprise |

## Recommended Deployment Strategy

1. **Development**: Docker Compose locally
2. **Staging**: Cloud Run or ECS Fargate
3. **Production**: EC2/GCE with managed database
4. **High Traffic**: Kubernetes cluster with auto-scaling

This covers all deployment options with specific resource requirements and costs. Choose the option that best fits your scale and budget requirements.