# 🐳 Docker Deployment Guide

Complete guide to deploying the Estado Novo Mapping Project using Docker containers.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development with Docker](#local-development-with-docker)
3. [Production Deployment](#production-deployment)
4. [Docker Compose](#docker-compose)
5. [Advanced Configuration](#advanced-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**Docker**
- Download: https://www.docker.com/
- Verify: `docker --version`
- Verify: `docker-compose --version`

**Git**
- For cloning the repository
- Verify: `git --version`

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 10GB disk space
- Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 20GB disk space
- Ubuntu 22.04+ / CentOS 9+

---

## Local Development with Docker

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/eu-cristofer/geo.git
cd geo/web
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables:**
```env
# MapTiler API Key (Required)
VITE_MAPTILER_KEY=your_actual_maptiler_key_here

# Optional customization
VITE_APP_TITLE=Estado Novo - Mapeamento dos Apelos
VITE_APP_DESCRIPTION=Mapa interativo dos apelos de desapropriação
```

### 3. Build and Run

**Option A: Docker Compose (Recommended)**
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Option B: Docker Build**
```bash
# Build image
docker build -t apelos-map \
  --build-arg VITE_MAPTILER_KEY=your_key_here \
  .

# Run container
docker run -d \
  --name apelos-map \
  -p 8080:80 \
  apelos-map

# View logs
docker logs -f apelos-map

# Stop container
docker stop apelos-map
docker rm apelos-map
```

### 4. Access Application

```bash
# Application will be available at:
http://localhost:8080

# Check container status
docker ps
```

---

## Production Deployment

### 1. Server Setup

**Ubuntu 22.04+ Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/eu-cristofer/geo.git
cd geo/web

# Create production environment
cp env.example .env
nano .env  # Add your MapTiler key

# Start services
docker-compose up -d

# Verify deployment
curl http://localhost:8080
```

### 3. Configure Reverse Proxy (Optional)

**Install Nginx:**
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

**Create Nginx Configuration:**
```bash
sudo nano /etc/nginx/sites-available/apelos-map
```

**Add Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle SPA routing
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Enable Site and Get SSL:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/apelos-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## Docker Compose

### docker-compose.yml Configuration

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_MAPTILER_KEY=${VITE_MAPTILER_KEY}
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.apelos-map.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.apelos-map.tls=true"
      - "traefik.http.routers.apelos-map.tls.certresolver=letsencrypt"

  # Optional: Add monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    profiles:
      - monitoring

volumes:
  grafana-data:
```

### Environment Management

**Production Environment (.env):**
```env
# MapTiler API Key
VITE_MAPTILER_KEY=your_production_key

# Application settings
VITE_APP_TITLE=Estado Novo - Mapeamento dos Apelos
VITE_APP_DESCRIPTION=Mapa interativo dos apelos de desapropriação

# Optional: Analytics
VITE_GA_TRACKING_ID=GA_MEASUREMENT_ID
```

**Development Environment (.env.development):**
```env
VITE_MAPTILER_KEY=your_dev_key
VITE_APP_TITLE=Estado Novo - Dev
NODE_ENV=development
```

---

## Advanced Configuration

### Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
ARG VITE_MAPTILER_KEY
ENV VITE_MAPTILER_KEY=$VITE_MAPTILER_KEY
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy data files
COPY public/data /usr/share/nginx/html/data

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**nginx.conf:**
```nginx
user nginx;
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Brotli compression
    load_module modules/ngx_http_brotli_filter_module.so;
    load_module modules/ngx_http_brotli_static_module.so;

    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Cache GeoJSON data
        location /data/ {
            expires 1d;
            add_header Cache-Control "public";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Health Checks

**Application Health Check:**
```typescript
// Add to src/main.ts
class HealthChecker {
  static async checkHealth(): Promise<boolean> {
    try {
      // Check if map loads
      const mapElement = document.getElementById('map');
      if (!mapElement) return false;

      // Check if data loads
      const response = await fetch('/data/apelos_clean.geojson');
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Expose health check endpoint
if (typeof window !== 'undefined') {
  (window as any).healthCheck = HealthChecker.checkHealth;
}
```

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
```

---

## Monitoring & Maintenance

### Logging

**Docker Compose with Logging:**
```yaml
services:
  web:
    # ... other config
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**View Logs:**
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs web

# View last 100 lines
docker-compose logs --tail=100 web
```

### Monitoring with Prometheus

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'apelos-map'
    static_configs:
      - targets: ['web:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

**Add Metrics to Application:**
```typescript
// Add metrics endpoint
if (typeof window !== 'undefined') {
  (window as any).metrics = {
    mapLoadTime: Date.now(),
    dataLoadTime: 0,
    userInteractions: 0
  };
}
```

### Backup Strategy

**Backup Script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/apelos-map"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
docker run --rm -v apelos-map_data:/data -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/data_$DATE.tar.gz -C /data .

# Backup configuration
cp docker-compose.yml $BACKUP_DIR/
cp .env $BACKUP_DIR/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/data_$DATE.tar.gz"
```

**Schedule Backups:**
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Update Strategy

**Update Script:**
```bash
#!/bin/bash
# update.sh

echo "Updating Apelos Map..."

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for health check
sleep 30

# Verify deployment
if curl -f http://localhost:8080/health; then
    echo "Update successful!"
else
    echo "Update failed, rolling back..."
    git reset --hard HEAD~1
    docker-compose up -d
fi
```

---

## Troubleshooting

### Common Issues

**Container Won't Start:**
```bash
# Check logs
docker-compose logs web

# Common causes:
# - Missing environment variables
# - Port already in use
# - Build errors
```

**Map Not Loading:**
```bash
# Check API key
docker-compose exec web env | grep VITE_MAPTILER_KEY

# Check if data files exist
docker-compose exec web ls -la /usr/share/nginx/html/data/

# Check nginx logs
docker-compose logs web
```

**Performance Issues:**
```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h
```

### Debug Mode

**Enable Debug Logging:**
```yaml
services:
  web:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
```

**Debug Container:**
```bash
# Access container shell
docker-compose exec web sh

# Check file permissions
ls -la /usr/share/nginx/html/

# Test nginx config
nginx -t

# Check nginx access
tail -f /var/log/nginx/access.log
```

### Reset Everything

**Complete Reset:**
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker rmi $(docker images -q)

# Remove volumes
docker volume prune

# Start fresh
docker-compose up -d --build
```

---

## Security Considerations

### Container Security

**Use Non-Root User:**
```dockerfile
# Add to Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

**Security Headers:**
```nginx
# Add to nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;" always;
```

### Network Security

**Firewall Configuration:**
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

**Docker Network Isolation:**
```yaml
services:
  web:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## Scaling

### Load Balancing

**Multiple Instances:**
```yaml
services:
  web:
    # ... config
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

**Nginx Load Balancer:**
```nginx
upstream apelos_map {
    server web1:80;
    server web2:80;
    server web3:80;
}

server {
    listen 80;
    location / {
        proxy_pass http://apelos_map;
    }
}
```

### Auto-Scaling

**Docker Swarm:**
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml apelos-map

# Scale service
docker service scale apelos-map_web=3
```

---

## Next Steps

After deploying with Docker:

1. **Set up monitoring** - Use Prometheus and Grafana
2. **Configure backups** - Implement regular backup strategy
3. **Set up CI/CD** - Automate deployments
4. **Monitor performance** - Track metrics and optimize
5. **Plan scaling** - Prepare for increased traffic

---

## Getting Help

**Docker Issues:**
- Check Docker documentation
- Review container logs
- Test locally first

**Contact:**
- **Francesca:** arq.francesca.martinelli@gmail.com
- **Cristofer:** cristofercosta@yahoo.com.br

---

**Happy containerizing! 🐳**

*Last Updated: October 2025*
