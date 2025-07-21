# AutoBR Linux VM Deployment Guide

This guide covers deploying AutoBR on a Linux VM either directly or using Docker, with local PostgreSQL database setup.

## Option 1: Direct Linux VM Deployment

### Prerequisites
- Ubuntu 22.04 or later (recommended)
- Minimum 4GB RAM, 2 vCPU, 50GB disk space
- Root or sudo access

### Step 1: System Updates and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common

# Install Node.js 18 (required for the app)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should show v18.x.x
npm --version   # Should show npm version
```

### Step 2: PostgreSQL Installation and Setup

```bash
# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE autobr;
CREATE USER autobr WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE autobr TO autobr;
ALTER USER autobr CREATEDB;
\q
EOF

# Configure PostgreSQL for local connections
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add this line after the existing local connections:
# local   autobr          autobr                                  md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Nginx Installation (Web Server)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
```

### Step 4: Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/autobr
cd /opt/autobr

# Clone or copy your application files here
# If using git:
# git clone https://github.com/your-repo/autobr.git .
# Or copy your files from your development environment

# Set proper ownership
sudo chown -R $USER:$USER /opt/autobr

# Install dependencies
npm install

# Build the application
npm run build
```

### Step 5: Environment Configuration

```bash
# Create production environment file
cat > /opt/autobr/.env.production << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://autobr:your_secure_password_here@localhost:5432/autobr

# Application Configuration
NODE_ENV=production
PORT=5000

# Required API Keys (you need to provide these)
GROQ_API_KEY=your_groq_api_key_here
RESEND_API_KEY=your_resend_api_key_here

# Authentication
NEXTAUTH_SECRET=your_super_secret_32_character_key
NEXTAUTH_URL=https://your-domain.com

# Payment Integration (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
EOF

# Set secure permissions
chmod 600 /opt/autobr/.env.production
```

### Step 6: Database Migration

```bash
# Navigate to app directory
cd /opt/autobr

# Set environment
export NODE_ENV=production

# Run database migration to create tables
npm run db:push
```

### Step 7: Process Manager Setup (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > /opt/autobr/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'autobr',
    script: 'server/index.js',
    cwd: '/opt/autobr',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/var/log/autobr/error.log',
    out_file: '/var/log/autobr/out.log',
    log_file: '/var/log/autobr/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/autobr
sudo chown -R $USER:$USER /var/log/autobr

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### Step 8: Nginx Configuration

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/autobr << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # SSL Configuration (you'll need to setup SSL certificates)
    ssl_certificate /etc/ssl/certs/autobr.crt;
    ssl_certificate_key /etc/ssl/private/autobr.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Client max body size for file uploads
    client_max_body_size 10M;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static file serving
    location /static/ {
        alias /opt/autobr/client/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/autobr.access.log;
    error_log /var/log/nginx/autobr.error.log;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/autobr /etc/nginx/sites-enabled/

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 9: SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace your-domain.com with your actual domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 10: File Upload Directory

```bash
# Create uploads directory
sudo mkdir -p /opt/autobr/uploads
sudo chown -R $USER:$USER /opt/autobr/uploads
sudo chmod 755 /opt/autobr/uploads
```

---

## Option 2: Docker Deployment

### Prerequisites
- Ubuntu 22.04 or later
- Minimum 4GB RAM, 2 vCPU, 50GB disk space
- Root or sudo access

### Step 1: Docker Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
docker compose version
```

### Step 2: Application Setup

```bash
# Create application directory
mkdir -p /opt/autobr
cd /opt/autobr

# Copy your application files here
# Or clone from git:
# git clone https://github.com/your-repo/autobr.git .
```

### Step 3: Environment Configuration

```bash
# Create environment file for Docker
cat > /opt/autobr/.env << 'EOF'
# Database Configuration
POSTGRES_PASSWORD=your_secure_postgres_password

# API Keys (you need to provide these)
GROQ_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_SECRET=your_32_character_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Optional: Grafana password for monitoring
GRAFANA_PASSWORD=your_grafana_password
EOF

# Set secure permissions
chmod 600 /opt/autobr/.env
```

### Step 4: Docker Compose Deployment

```bash
# Make sure you're in the app directory
cd /opt/autobr

# Start all services
docker compose up -d

# Check if all services are running
docker compose ps

# View logs if needed
docker compose logs app
docker compose logs postgres
```

### Step 5: Database Migration

```bash
# Wait for PostgreSQL to be ready (about 30 seconds)
sleep 30

# Run database migration
docker compose exec app npm run db:push
```

### Step 6: SSL Setup (Optional but recommended)

```bash
# Install Certbot on host
sudo apt install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Create SSL directory for Docker
sudo mkdir -p /opt/autobr/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/autobr/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/autobr/ssl/
sudo chown -R 1000:1000 /opt/autobr/ssl

# Update docker-compose.yml nginx labels with your domain
# Edit docker-compose.yml and replace "your-domain.com" with your actual domain
```

## Required API Keys

You need to obtain these API keys for the application to work:

### Essential APIs
1. **Groq API Key** (for AI features):
   - Sign up at https://console.groq.com/
   - Create API key
   - Add to `GROQ_API_KEY`

2. **Resend API Key** (for emails):
   - Sign up at https://resend.com/
   - Create API key
   - Add to `RESEND_API_KEY`

### Optional Payment APIs
1. **Stripe** (for credit card payments):
   - Create account at https://stripe.com/
   - Get secret key from dashboard
   - Add to `STRIPE_SECRET_KEY`

2. **PayPal** (for PayPal payments):
   - Create developer account at https://developer.paypal.com/
   - Create application
   - Add client ID and secret

## Monitoring and Maintenance

### For Direct Installation:
```bash
# Check application status
pm2 status

# View logs
pm2 logs autobr

# Restart application
pm2 restart autobr

# Monitor system resources
htop
```

### For Docker Installation:
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Restart services
docker compose restart app

# Update application
docker compose pull
docker compose up -d
```

## Security Considerations

1. **Firewall Configuration:**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

2. **Database Security:**
   - Use strong passwords
   - Restrict database access to localhost only
   - Regular backups

3. **Application Security:**
   - Keep all dependencies updated
   - Use HTTPS only
   - Secure file upload directory

## Backup Strategy

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U autobr -h localhost autobr > $BACKUP_DIR/database.sql

# Application files backup
tar -czf $BACKUP_DIR/app_files.tar.gz /opt/autobr/uploads

# Keep only last 7 days of backups
find /opt/backups -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /opt/backup.sh

# Setup daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup.sh") | crontab -
```

## Troubleshooting

### Common Issues:

1. **Application not starting:**
   - Check logs: `pm2 logs` or `docker compose logs app`
   - Verify environment variables
   - Check database connection

2. **Database connection errors:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Confirm database user permissions

3. **API errors:**
   - Verify all required API keys are set
   - Check API key validity
   - Review rate limits

4. **File upload issues:**
   - Check uploads directory permissions
   - Verify disk space
   - Review Nginx client_max_body_size

## Performance Optimization

### For Production:
1. **Database optimization:**
   - Configure PostgreSQL connection pooling
   - Optimize shared_buffers and work_mem
   - Regular VACUUM and ANALYZE

2. **Application optimization:**
   - Use PM2 cluster mode
   - Enable gzip compression
   - Configure proper caching headers

3. **System optimization:**
   - Monitor RAM and CPU usage
   - Setup log rotation
   - Regular system updates

This guide provides both direct Linux VM deployment and Docker-based deployment options. Choose the one that best fits your infrastructure requirements and expertise level.