#!/bin/bash

# AutoBR Docker Deployment Script
# This script automates the Docker-based deployment process for AutoBR

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
COMPOSE_FILE="docker-compose.prod.yml"

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
    if [[ $TOTAL_MEM -lt 4000000 ]]; then
        log_warn "System has less than 4GB RAM. AutoBR with Docker may not perform optimally."
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [[ $AVAILABLE_SPACE -lt 10000000 ]]; then
        log_warn "Less than 10GB disk space available. Consider freeing up space."
    fi
    
    log_info "System requirements check completed"
}

install_docker() {
    log_blue "Installing Docker and Docker Compose..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install dependencies
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed. Version: $(docker --version)"
    else
        # Add Docker GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        log_info "Docker installed successfully"
    fi
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Install docker-compose if not available
    if ! docker compose version &> /dev/null; then
        log_info "Installing docker-compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Verify installation
    docker --version
    docker compose version
    
    log_info "Docker installation completed"
}

setup_directories() {
    log_blue "Setting up directories..."
    
    # Create application directory
    sudo mkdir -p ${APP_DIR}
    sudo chown -R $USER:$USER ${APP_DIR}
    
    # Copy application files
    if [[ -f "package.json" ]]; then
        log_info "Copying application files..."
        cp -r . ${APP_DIR}/
        cd ${APP_DIR}
    else
        log_error "No package.json found. Please run this script from the AutoBR root directory."
        exit 1
    fi
    
    # Create required directories
    mkdir -p ${APP_DIR}/uploads
    mkdir -p ${APP_DIR}/logs
    mkdir -p ${APP_DIR}/logs/nginx
    mkdir -p ${APP_DIR}/backups
    mkdir -p ${APP_DIR}/ssl
    mkdir -p ${APP_DIR}/nginx/conf.d
    
    # Set permissions
    chmod 755 ${APP_DIR}/uploads
    chmod 755 ${APP_DIR}/logs
    
    log_info "Directory setup completed"
}

configure_environment() {
    log_blue "Configuring environment..."
    
    # Create .env file for Docker
    cat > ${APP_DIR}/.env << EOF
# Database Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Required API Keys
GROQ_API_KEY=${GROQ_API_KEY}
RESEND_API_KEY=${RESEND_API_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

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

# Monitoring (Optional)
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin123}

# Domain Configuration
DOMAIN=${DOMAIN:-localhost}
NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:5000}
EOF
    
    chmod 600 ${APP_DIR}/.env
    
    log_info "Environment configuration completed"
}

setup_nginx_config() {
    log_blue "Setting up Nginx configuration..."
    
    # Create main nginx.conf
    cat > ${APP_DIR}/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    server_tokens off;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF
    
    # Update the domain in nginx config
    if [[ -f "${APP_DIR}/nginx/conf.d/autobr.conf" ]]; then
        sed -i "s/your-domain.com/${DOMAIN:-localhost}/g" ${APP_DIR}/nginx/conf.d/autobr.conf
    fi
    
    log_info "Nginx configuration setup completed"
}

setup_ssl() {
    log_blue "Setting up SSL configuration..."
    
    if [[ -n "${DOMAIN}" && "${DOMAIN}" != "localhost" ]]; then
        # Install certbot on host system
        sudo apt install -y certbot
        
        log_info "SSL certificate setup will be handled after deployment"
        log_info "Run the following commands after deployment:"
        log_info "  sudo certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN}"
        log_info "  sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${APP_DIR}/ssl/"
        log_info "  sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${APP_DIR}/ssl/"
        log_info "  sudo chown -R 1000:1000 ${APP_DIR}/ssl"
        log_info "  docker compose -f ${COMPOSE_FILE} restart nginx"
    else
        log_warn "No valid domain specified. SSL will not be configured."
    fi
}

build_and_deploy() {
    log_blue "Building and deploying AutoBR..."
    
    cd ${APP_DIR}
    
    # Build Docker images
    log_info "Building Docker images..."
    docker compose -f ${COMPOSE_FILE} build
    
    # Start services
    log_info "Starting services..."
    docker compose -f ${COMPOSE_FILE} up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    docker compose -f ${COMPOSE_FILE} ps
    
    # Run database migration
    log_info "Running database migration..."
    sleep 10  # Wait a bit more for postgres to be ready
    docker compose -f ${COMPOSE_FILE} exec -T app npm run db:push
    
    log_info "Deployment completed"
}

setup_backup() {
    log_blue "Setting up backup system..."
    
    # Create backup script
    sudo tee /opt/backup-${APP_NAME}-docker.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/\$(date +%Y%m%d_%H%M%S)"
mkdir -p \$BACKUP_DIR

# Database backup
docker compose -f ${APP_DIR}/${COMPOSE_FILE} exec -T postgres pg_dump -U autobr autobr > \$BACKUP_DIR/database.sql

# Application files backup
tar -czf \$BACKUP_DIR/app_files.tar.gz ${APP_DIR}/uploads

# Docker volumes backup
docker run --rm -v ${APP_NAME}_postgres_data:/data -v \$BACKUP_DIR:/backup alpine tar czf /backup/postgres_volume.tar.gz -C /data .
docker run --rm -v ${APP_NAME}_redis_data:/data -v \$BACKUP_DIR:/backup alpine tar czf /backup/redis_volume.tar.gz -C /data .

# Keep only last 7 days of backups
find /opt/backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "Backup completed: \$BACKUP_DIR"
EOF
    
    sudo chmod +x /opt/backup-${APP_NAME}-docker.sh
    
    # Setup daily backup cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-${APP_NAME}-docker.sh") | crontab -
    
    log_info "Backup system setup completed"
}

configure_firewall() {
    log_blue "Configuring firewall..."
    
    # Install and configure UFW
    sudo apt install -y ufw
    
    # Configure UFW
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    log_info "Firewall configuration completed"
}

setup_monitoring() {
    log_blue "Setting up monitoring..."
    
    # Create monitoring script
    cat > ${APP_DIR}/monitor.sh << 'EOF'
#!/bin/bash

echo "=== AutoBR Docker Status ==="
echo "Date: $(date)"
echo ""

echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream

echo ""
echo "=== Application Health ==="
curl -f http://localhost:5000/api/health 2>/dev/null && echo "✓ Application is healthy" || echo "✗ Application is not responding"

echo ""
echo "=== Database Status ==="
docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U autobr -d autobr && echo "✓ Database is ready" || echo "✗ Database is not ready"

echo ""
echo "=== Redis Status ==="
docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping && echo "✓ Redis is responding" || echo "✗ Redis is not responding"

echo ""
echo "=== Recent Logs ==="
echo "Application logs (last 20 lines):"
docker compose -f docker-compose.prod.yml logs --tail=20 app

echo ""
echo "Nginx logs (last 10 lines):"
docker compose -f docker-compose.prod.yml logs --tail=10 nginx
EOF
    
    chmod +x ${APP_DIR}/monitor.sh
    
    log_info "Monitoring setup completed. Run './monitor.sh' to check status"
}

# Main deployment function
main() {
    log_info "Starting AutoBR Docker deployment..."
    
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
    install_docker
    setup_directories
    configure_environment
    setup_nginx_config
    setup_ssl
    build_and_deploy
    setup_backup
    configure_firewall
    setup_monitoring
    
    log_info ""
    log_info "=================================="
    log_info "AutoBR Docker deployment completed successfully!"
    log_info "=================================="
    log_info ""
    log_info "Application URLs:"
    log_info "  HTTP:  http://${DOMAIN:-localhost}"
    log_info "  HTTPS: https://${DOMAIN:-localhost} (if SSL configured)"
    log_info "  Internal: http://localhost:5000"
    log_info ""
    log_info "Management Commands:"
    log_info "  Check status: cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} ps"
    log_info "  View logs: cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} logs -f app"
    log_info "  Monitor: cd ${APP_DIR} && ./monitor.sh"
    log_info "  Stop: cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} down"
    log_info "  Restart: cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} restart"
    log_info ""
    log_info "Optional Services (if enabled in docker-compose.yml):"
    log_info "  Grafana: http://localhost:3000 (admin/\$GRAFANA_PASSWORD)"
    log_info "  Prometheus: http://localhost:9090"
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure your domain DNS to point to this server"
    log_info "2. Set up SSL certificate (if using a domain)"
    log_info "3. Test the application functionality"
    log_info "4. Monitor application performance"
    
    if [[ -n "${DOMAIN}" && "${DOMAIN}" != "localhost" ]]; then
        log_info ""
        log_warn "SSL Setup Required:"
        log_info "Run these commands to setup SSL:"
        log_info "  sudo certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN}"
        log_info "  sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${APP_DIR}/ssl/"
        log_info "  sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${APP_DIR}/ssl/"
        log_info "  sudo chown -R 1000:1000 ${APP_DIR}/ssl"
        log_info "  cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} restart nginx"
    fi
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
    echo "  GRAFANA_PASSWORD     - Grafana admin password (default: admin123)"
    echo ""
    echo "Example:"
    echo "export POSTGRES_PASSWORD='your_secure_password'"
    echo "export NEXTAUTH_SECRET='your_32_character_secret_key_here'"
    echo "export GROQ_API_KEY='your_groq_api_key'"
    echo "export RESEND_API_KEY='your_resend_api_key'"
    echo "export DOMAIN='your-domain.com'"
    echo "export NEXTAUTH_URL='https://your-domain.com'"
    echo "./docker-deploy.sh"
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
    exit 0
fi

# Check if user needs to rejoin docker group
if ! groups | grep -q docker; then
    log_warn "You may need to log out and log back in for docker group membership to take effect"
    log_warn "Or run: newgrp docker"
fi

# Run main function
main "$@"