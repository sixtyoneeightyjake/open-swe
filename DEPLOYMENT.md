# Open SWE Backend Deployment Guide

This guide will help you deploy the Open SWE backend to a Vultr server.

## Prerequisites

- A Vultr server (Ubuntu 20.04+ recommended)
- Domain name pointing to your server
- GitHub App configured for your repositories
- API keys for required services

## Quick Start

1. **Clone the repository on your Vultr server:**
   ```bash
   git clone <your-repo-url>
   cd open-swe
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

3. **Configure environment variables:**
   ```bash
   nano .env
   ```
   Fill in all the required values based on the template.

4. **Restart services:**
   ```bash
   docker-compose restart
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Server Requirements

- **OS:** Ubuntu 20.04+ or similar Linux distribution
- **RAM:** Minimum 2GB, recommended 4GB+
- **Storage:** Minimum 20GB SSD
- **CPU:** 2+ cores recommended

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install other tools
sudo apt install -y nginx certbot python3-certbot-nginx ufw git
```

### 3. Configure Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8123/tcp
```

### 4. Set Up SSL Certificates

```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem
```

### 5. Configure Environment

1. Copy the environment template:
   ```bash
   cp .env.production .env
   ```

2. Edit the `.env` file with your actual values:
   ```bash
   nano .env
   ```

### 6. Deploy the Application

```bash
# Build and start services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | `sk-ant-...` |
| `GITHUB_APP_ID` | GitHub App ID | `123456` |
| `GITHUB_PRIVATE_KEY` | GitHub App private key | `-----BEGIN RSA...` |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | `your-secret` |
| `OPEN_SWE_APP_URL` | Your server's public URL | `https://api.yourdomain.com` |
| `ENCRYPTION_KEY` | 32-character encryption key | `abcd1234...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing | `false` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `DAYTONA_API_KEY` | Daytona sandbox API key | - |
| `FIRECRAWL_API_KEY` | Firecrawl web scraping key | - |

## GitHub App Configuration

1. **Create a GitHub App:**
   - Go to GitHub Settings > Developer settings > GitHub Apps
   - Click "New GitHub App"
   - Fill in the required information

2. **Configure Webhook:**
   - Webhook URL: `https://your-domain.com/webhooks/github`
   - Content type: `application/json`
   - Secret: Use the same value as `GITHUB_WEBHOOK_SECRET`

3. **Set Permissions:**
   - Repository permissions:
     - Contents: Read & Write
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read
   - Subscribe to events:
     - Issues
     - Pull requests
     - Push

4. **Install the App:**
   - Install the app on your repositories
   - Note the installation ID for configuration

## Monitoring and Maintenance

### View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f open-swe-backend
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Health Checks
```bash
# Check service health
curl http://localhost:8123/health

# Check service status
docker-compose ps
```

### Backup and Recovery

1. **Backup configuration:**
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml nginx.conf ssl/
   ```

2. **Backup data:**
   ```bash
   docker-compose exec open-swe-backend tar -czf /app/data-backup.tar.gz /app/data
   ```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   - Check logs: `docker-compose logs open-swe-backend`
   - Verify environment variables in `.env`
   - Ensure all required API keys are set

2. **GitHub webhooks not working:**
   - Verify webhook URL is accessible from internet
   - Check webhook secret matches environment variable
   - Ensure firewall allows traffic on port 443/80

3. **SSL certificate issues:**
   - Verify domain DNS points to your server
   - Check certificate files exist in `ssl/` directory
   - Ensure nginx configuration uses correct domain name

4. **High memory usage:**
   - Monitor with: `docker stats`
   - Consider increasing server RAM
   - Adjust Docker memory limits if needed

### Performance Optimization

1. **Enable log rotation:**
   ```bash
   # Add to docker-compose.yml under logging:
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

2. **Monitor resource usage:**
   ```bash
   # Install monitoring tools
   sudo apt install htop iotop
   
   # Monitor Docker containers
   docker stats
   ```

## Security Considerations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Regular security scans:**
   ```bash
   # Scan Docker images
   docker scan open-swe_open-swe-backend
   ```

3. **Monitor access logs:**
   ```bash
   # Check nginx access logs
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Use strong secrets:**
   - Generate strong API keys
   - Use complex webhook secrets
   - Rotate keys regularly

## Support

If you encounter issues:

1. Check the logs first: `docker-compose logs -f`
2. Verify your environment configuration
3. Ensure all external services (GitHub, Anthropic, etc.) are accessible
4. Check firewall and network connectivity

For additional help, refer to the main project documentation or create an issue in the repository.