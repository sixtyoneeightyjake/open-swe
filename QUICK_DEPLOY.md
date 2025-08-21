# Quick Deployment Guide for Existing Server

Since you already have a server with custom domain and SSL setup, here's a streamlined deployment process:

## Prerequisites ✅
- [x] Server with Ubuntu/Debian
- [x] Custom domain configured
- [x] SSL certificates setup
- [x] SSH access to server

## Step 1: Prepare Your Server

```bash
# SSH into your server
ssh your-user@your-domain.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for Docker group changes
exit
```

## Step 2: Deploy the Application

```bash
# SSH back in
ssh your-user@your-domain.com

# Clone the repository
git clone https://github.com/your-username/open-swe.git
cd open-swe

# Copy and configure environment
cp .env.production .env
nano .env  # Edit with your actual values
```

## Step 3: Configure Environment Variables

Edit `.env` with your actual values:

```bash
# Required - LLM Provider (choose one)
ANTHROPIC_API_KEY=your_actual_anthropic_key
# OR
OPENAI_API_KEY=your_actual_openai_key

# Required - GitHub App
GITHUB_APP_ID=your_actual_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour_actual_private_key\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_actual_webhook_secret
GITHUB_TRIGGER_USERNAME=your_github_username

# Required - Server URL
OPEN_SWE_APP_URL=https://your-actual-domain.com

# Optional but recommended
DAYTONA_API_KEY=your_daytona_key  # For sandboxing
FIRECRAWL_API_KEY=your_firecrawl_key  # For web scraping
LANGCHAIN_API_KEY=your_langsmith_key  # For tracing
```

## Step 4: Update Nginx Configuration

```bash
# Update nginx.conf with your domain
sed -i 's/your-domain.com/your-actual-domain.com/g' nginx.conf

# If you have existing SSL certificates, update paths in nginx.conf
# Edit the SSL certificate paths to match your setup
nano nginx.conf
```

## Step 5: Deploy

```bash
# Build and start services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## Step 6: Configure GitHub Webhook

1. Go to your GitHub App settings
2. Update webhook URL to: `https://your-domain.com/webhooks/github/unified`
3. Ensure webhook secret matches your `.env` file

## Step 7: Test Deployment

```bash
# Test health endpoint
curl https://your-domain.com/health

# Test metrics endpoint
curl https://your-domain.com/metrics

# Check logs
docker-compose logs open-swe-backend
```

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f open-swe-backend
```

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose logs open-swe-backend

# Check environment variables
docker-compose exec open-swe-backend env | grep -E "GITHUB|ANTHROPIC|OPENAI"
```

### GitHub Webhooks Not Working
1. Check webhook URL in GitHub App settings
2. Verify webhook secret matches `.env`
3. Check nginx logs: `docker-compose logs nginx`
4. Test webhook endpoint: `curl -X POST https://your-domain.com/webhooks/github/unified`

### Performance Issues
- Monitor metrics at `https://your-domain.com/metrics`
- Check resource usage: `docker stats`
- Review rate limiting in nginx.conf

## Security Checklist

- [ ] Environment variables are properly set
- [ ] GitHub webhook secret is secure
- [ ] SSL certificates are valid
- [ ] Firewall allows only necessary ports (80, 443, 22)
- [ ] Docker containers run as non-root user
- [ ] Rate limiting is configured

## Next Steps

Once deployed successfully:

1. **Set up monitoring**: Add Prometheus + Grafana (see `MONITORING.md`)
2. **Configure backups**: Set up automated backups for logs and data
3. **Set up alerts**: Configure alerts for service failures
4. **Performance tuning**: Monitor and optimize based on usage patterns

---

**Need help?** Check the full deployment guide in `DEPLOYMENT.md` or review logs with `docker-compose logs -f`.