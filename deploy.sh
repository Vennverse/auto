#!/bin/bash

# AutoBR Production Deployment Script
# This script automates the deployment process for AutoBR on Linux VMs

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="autobr"
APP_DIR="/opt/${APP_NAME}"
SERVICE_NAME="${APP_NAME}"
POSTGRES_DB="${APP_NAME}"
POSTGRES_USER="${APP_NAME}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_blue() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_requirements() {
    log_blue "Checking system requirements..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        log_error "This script requires root privileges or sudo access"
        exit 1
    fi
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_warn "This script is optimized for Ubuntu. Proceed with caution on other distributions."
    fi
    
    # Check minimum system requirements
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    if [[ $TOTAL_MEM -lt 3000000 ]]; then
        log_warn "System has less than 3GB RAM. AutoBR may not perform optimally."
    fi
    
    log_info "System requirements check completed"
}

install_dependencies() {
    log_blue "Installing system dependencies..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install essential packages
    sudo apt install -y curl wget git build-essential software-properties-common nginx postgresql postgresql-contrib redis-server ufw htop
    
    # Install Node.js 18
    if ! node --version | grep -q "v18"; then
        log_info "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2 process manager..."
        sudo npm install -g pm2
    fi
    
    # Install certbot for SSL
    sudo apt install -y certbot python3-certbot-nginx
    
    log_info "Dependencies installed successfully"
}

setup_database() {
    log_blue "Setting up PostgreSQL database..."
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
        CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}') THEN
        CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};
    END IF;
    
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
    ALTER USER ${POSTGRES_USER} CREATEDB;
END
\$\$;
EOF
    
    # Configure PostgreSQL
    PG_VERSION=$(ls /etc/postgresql/)
    PG_CONFIG="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
    PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
    
    # Backup original config
    sudo cp ${PG_HBA} ${PG_HBA}.backup
    
    # Add local connection for app user
    if ! sudo grep -q "local   ${POSTGRES_DB}" ${PG_HBA}; then
        echo "local   ${POSTGRES_DB}          ${POSTGRES_USER}                                  md5" | sudo tee -a ${PG_HBA}
    fi
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    log_info "PostgreSQL setup completed"
}

setup_redis() {
    log_blue "Setting up Redis..."
    
    # Start and enable Redis
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    # Configure Redis for production
    sudo sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    sudo systemctl restart redis-server
    
    log_info "Redis setup completed"
}

deploy_application() {
    log_blue "Deploying AutoBR application..."
    
    # Create application directory
    sudo mkdir -p ${APP_DIR}
    sudo chown -R $USER:$USER ${APP_DIR}
    
    # Copy application files (assuming they're in current directory)
    if [[ -f "package.json" ]]; then
        log_info "Copying application files..."
        cp -r . ${APP_DIR}/
        cd ${APP_DIR}
    else
        log_error "No package.json found. Please run this script from the AutoBR root directory."
        exit 1
    fi
    
    # Install dependencies and build
    log_info "Installing application dependencies..."
    npm install --production
    
    log_info "Building application..."
    npm run build
    
    # Create uploads directory
    mkdir -p ${APP_DIR}/uploads
    chmod 755 ${APP_DIR}/uploads
    
    # Create logs directory
    sudo mkdir -p /var/log/${APP_NAME}
    sudo chown -R $USER:$USER /var/log/${APP_NAME}
    
    log_info "Application deployment completed"
}

configure_environment() {
    log_blue "Configuring environment..."
    
    # Create production environment file
    cat > ${APP_DIR}/.env.production << EOF
# Database Configuration
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

# Application Configuration
NODE_ENV=production
PORT=5000

# Authentication
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}

# Required API Keys
GROQ_API_KEY=${GROQ_API_KEY}
RESEND_API_KEY=${RESEND_API_KEY}

# Payment Integration (Optional)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID:-}
PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET:-}

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-}

# Redis Configuration
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=${APP_DIR}/uploads
MAX_FILE_SIZE=10485760

# Security
CORS_ORIGIN=${NEXTAUTH_URL}
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/${APP_NAME}/app.log
EOF
    
    chmod 600 ${APP_DIR}/.env.production
    
    log_info "Environment configuration completed"
}

setup_pm2() {
    log_blue "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > ${APP_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'server/index.js',
    cwd: '${APP_DIR}',
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
    error_file: '/var/log/${APP_NAME}/error.log',
    out_file: '/var/log/${APP_NAME}/out.log',
    log_file: '/var/log/${APP_NAME}/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Run database migration
    log_info "Running database migration..."
    cd ${APP_DIR}
    NODE_ENV=production npm run db:push
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    log_info "PM2 setup completed"
}

configure_nginx() {
    log_blue "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL will be configured by certbot
    
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
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log /var/log/nginx/${APP_NAME}.error.log;
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    sudo systemctl restart nginx
    
    log_info "Nginx configuration completed"
}

setup_ssl() {
    log_blue "Setting up SSL certificate..."
    
    if [[ -n "${DOMAIN}" ]]; then
        # Get SSL certificate
        sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
        
        # Setup automatic renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        log_info "SSL certificate setup completed"
    else
        log_warn "No domain specified. SSL certificate not configured."
    fi
}

configure_firewall() {
    log_blue "Configuring firewall..."
    
    # Configure UFW
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    
    log_info "Firewall configuration completed"
}

setup_backup() {
    log_blue "Setting up backup system..."
    
    # Create backup script
    sudo tee /opt/backup-${APP_NAME}.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Database backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -U ${POSTGRES_USER} -h localhost ${POSTGRES_DB} > $BACKUP_DIR/database.sql

# Application files backup
tar -czf $BACKUP_DIR/app_files.tar.gz ${APP_DIR}/uploads

# Keep only last 7 days of backups
find /opt/backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "Backup completed: $BACKUP_DIR"
EOF
    
    sudo chmod +x /opt/backup-${APP_NAME}.sh
    
    # Setup daily backup cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-${APP_NAME}.sh") | crontab -
    
    log_info "Backup system setup completed"
}

# Main deployment function
main() {
    log_info "Starting AutoBR deployment..."
    
    # Check for required environment variables
    if [[ -z "${POSTGRES_PASSWORD}" ]]; then
        log_error "POSTGRES_PASSWORD environment variable is required"
        exit 1
    fi
    
    if [[ -z "${NEXTAUTH_SECRET}" ]]; then
        log_error "NEXTAUTH_SECRET environment variable is required"
        exit 1
    fi
    
    if [[ -z "${GROQ_API_KEY}" ]]; then
        log_error "GROQ_API_KEY environment variable is required"
        exit 1
    fi
    
    if [[ -z "${RESEND_API_KEY}" ]]; then
        log_error "RESEND_API_KEY environment variable is required"
        exit 1
    fi
    
    # Run deployment steps
    check_requirements
    install_dependencies
    setup_database
    setup_redis
    deploy_application
    configure_environment
    setup_pm2
    configure_nginx
    
    if [[ -n "${DOMAIN}" ]]; then
        setup_ssl
    fi
    
    configure_firewall
    setup_backup
    
    log_info "AutoBR deployment completed successfully!"
    log_info "Application should be available at: ${NEXTAUTH_URL:-http://localhost:5000}"
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure your domain DNS to point to this server"
    log_info "2. Test the application functionality"
    log_info "3. Monitor logs: pm2 logs ${APP_NAME}"
    log_info "4. Check application status: pm2 status"
}

# Usage information
usage() {
    echo "Usage: $0"
    echo ""
    echo "Required environment variables:"
    echo "  POSTGRES_PASSWORD     - Password for PostgreSQL user"
    echo "  NEXTAUTH_SECRET       - Secret key for authentication (32+ characters)"
    echo "  GROQ_API_KEY         - Groq API key for AI features"
    echo "  RESEND_API_KEY       - Resend API key for email functionality"
    echo ""
    echo "Optional environment variables:"
    echo "  DOMAIN               - Your domain name (e.g., example.com)"
    echo "  NEXTAUTH_URL         - Full URL of your application (e.g., https://example.com)"
    echo "  STRIPE_SECRET_KEY    - Stripe secret key for payments"
    echo "  PAYPAL_CLIENT_ID     - PayPal client ID"
    echo "  PAYPAL_CLIENT_SECRET - PayPal client secret"
    echo ""
    echo "Example:"
    echo "export POSTGRES_PASSWORD='your_secure_password'"
    echo "export NEXTAUTH_SECRET='your_32_character_secret_key_here'"
    echo "export GROQ_API_KEY='your_groq_api_key'"
    echo "export RESEND_API_KEY='your_resend_api_key'"
    echo "export DOMAIN='your-domain.com'"
    echo "export NEXTAUTH_URL='https://your-domain.com'"
    echo "./deploy.sh"
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@"