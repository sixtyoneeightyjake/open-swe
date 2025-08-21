#!/bin/bash

# Open SWE Backend Deployment Script for Vultr
# This script helps deploy the Open SWE backend to a Vultr server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Open SWE Backend Deployment Script${NC}"
echo "=========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command_exists docker; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose if not present
if ! command_exists docker-compose; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install other required packages
echo -e "${YELLOW}📦 Installing additional packages...${NC}"
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8123/tcp  # LangGraph port
echo -e "${GREEN}✅ Firewall configured${NC}"

# Create application directory
APP_DIR="/opt/open-swe"
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file from template...${NC}"
    cp .env.production .env
    echo -e "${RED}❗ IMPORTANT: Please edit the .env file with your actual configuration values${NC}"
    echo -e "${YELLOW}   Run: nano .env${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p data logs ssl

# Set up SSL certificates (Let's Encrypt)
read -p "Do you want to set up SSL certificates with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " DOMAIN
    read -p "Enter your email address: " EMAIL
    
    echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
    sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Copy certificates to ssl directory
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
    sudo chown $USER:$USER ssl/*.pem
    
    # Update nginx.conf with actual domain
    sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf
    
    echo -e "${GREEN}✅ SSL certificates configured${NC}"
fi

# Build and start the application
echo -e "${YELLOW}🏗️  Building and starting the application...${NC}"
docker-compose build
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running successfully!${NC}"
else
    echo -e "${RED}❌ Some services failed to start. Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Display status
echo -e "${BLUE}📊 Deployment Status:${NC}"
docker-compose ps

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Edit the .env file with your actual configuration values"
echo "2. Update your GitHub App webhook URL to point to your server"
echo "3. Configure your DNS to point to this server"
echo "4. Test the deployment with: curl http://localhost:8123/health"
echo "5. Monitor logs with: docker-compose logs -f"
echo "6. To restart services: docker-compose restart"
echo "7. To stop services: docker-compose down"

echo -e "${BLUE}🔗 Useful commands:${NC}"
echo "- View logs: docker-compose logs -f"
echo "- Restart services: docker-compose restart"
echo "- Update application: git pull && docker-compose build && docker-compose up -d"
echo "- Check service status: docker-compose ps"