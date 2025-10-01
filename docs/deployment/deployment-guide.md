# Professional Deployment Guide

This guide covers deploying your QGIS map as a professional web application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
   - [Vercel (Recommended)](#vercel-recommended)
   - [Netlify](#netlify)
   - [GitHub Pages](#github-pages)
   - [Docker/VPS](#dockervps)
4. [Advanced Configuration](#advanced-configuration)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Node.js 20+**: [Download here](https://nodejs.org/)
- **Git**: For version control
- **MapTiler API Key**: [Get free key](https://www.maptiler.com/cloud/)

### Optional
- **Vercel Account**: For easiest deployment
- **GitHub Account**: For CI/CD
- **Docker**: For containerized deployment

---

## Local Development

### 1. Initial Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file:
```env
VITE_MAPTILER_KEY=your_actual_api_key_here
```

**Get MapTiler Key:**
1. Visit https://www.maptiler.com/cloud/
2. Sign up (free tier: 100k tile loads/month)
3. Go to Account → Keys
4. Copy your key

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Test Production Build

```bash
npm run build
npm run preview
```

---

## Production Deployment

### Vercel (Recommended)

**Best for: Beginners, automatic deployments, global CDN**

#### Method 1: CLI Deployment (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to web directory
cd web

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: apelos-map
# - Directory: ./
# - Override settings? No
```

**Add Environment Variable:**
```bash
vercel env add VITE_MAPTILER_KEY production
# Paste your MapTiler key when prompted
```

**Deploy to Production:**
```bash
vercel --prod
```

#### Method 2: GitHub Integration (Automated)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add web application"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Visit https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - Framework: Vite
     - Root Directory: `web`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_MAPTILER_KEY` with your key
   - Apply to: Production, Preview, Development

4. **Deploy:**
   - Vercel will automatically deploy on every push
   - Preview URLs for pull requests
   - Production URL: `https://your-project.vercel.app`

**Custom Domain:**
- Settings → Domains → Add
- Follow DNS configuration instructions

---

### Netlify

**Best for: Open source projects, form handling, serverless functions**

#### Method 1: Drag & Drop

```bash
# Build locally
cd web
npm run build

# Drag dist/ folder to Netlify drop zone
# Visit https://app.netlify.com/drop
```

#### Method 2: CLI Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
cd web
netlify init

# Deploy
netlify deploy --prod
```

#### Method 3: GitHub Integration

1. **Push to GitHub**

2. **Connect to Netlify:**
   - Visit https://app.netlify.com
   - New site from Git
   - Select your repository

3. **Build Settings:**
   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/dist`

4. **Environment Variables:**
   - Site settings → Build & deploy → Environment
   - Add `VITE_MAPTILER_KEY`

5. **Deploy:**
   - Triggers automatically on push
   - URL: `https://your-site.netlify.app`

---

### GitHub Pages

**Best for: Free hosting, simple projects, educational use**

#### Setup

1. **Enable GitHub Pages:**
   ```
   Repository → Settings → Pages
   Source: GitHub Actions
   ```

2. **Add Secret:**
   ```
   Settings → Secrets and variables → Actions
   New repository secret:
   Name: VITE_MAPTILER_KEY
   Value: your_maptiler_key
   ```

3. **Push to Main:**
   ```bash
   git add .
   git commit -m "Deploy web app"
   git push origin main
   ```

4. **Wait for Deployment:**
   - Check Actions tab for build progress
   - Site will be available at: `https://username.github.io/geo/`

#### Troubleshooting GitHub Pages

If paths don't work:
1. Update `vite.config.ts`:
   ```typescript
   base: '/geo/',  // Your repo name
   ```

2. Rebuild and push:
   ```bash
   npm run build
   git add .
   git commit -m "Fix base path"
   git push
   ```

---

### Docker/VPS

**Best for: Full control, custom infrastructure, enterprise**

#### Local Docker Testing

```bash
cd web

# Build image
docker build -t apelos-map \
  --build-arg VITE_MAPTILER_KEY=your_key \
  .

# Run container
docker run -p 8080:80 apelos-map

# Visit http://localhost:8080
```

#### Docker Compose

```bash
# Create .env file with VITE_MAPTILER_KEY
echo "VITE_MAPTILER_KEY=your_key" > .env

# Start
docker-compose up -d

# Stop
docker-compose down
```

#### Production VPS Deployment

**Prerequisites:**
- Ubuntu 22.04+ server
- Root/sudo access
- Domain name (optional)

**1. Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**2. Deploy Application:**
```bash
# Clone repository
git clone https://github.com/yourusername/geo.git
cd geo/web

# Create environment file
nano .env
# Add: VITE_MAPTILER_KEY=your_key

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f
```

**3. Configure Nginx Reverse Proxy (Optional):**

Install Nginx:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create config:
```bash
sudo nano /etc/nginx/sites-available/apelos-map
```

Add:
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
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/apelos-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

**4. Setup Auto-updates (Optional):**
```bash
# Create update script
cat > ~/update-map.sh << 'EOF'
#!/bin/bash
cd ~/geo
git pull
cd web
docker-compose down
docker-compose up -d --build
EOF

chmod +x ~/update-map.sh

# Add to crontab for weekly updates
crontab -e
# Add: 0 2 * * 0 /home/username/update-map.sh
```

---

## Advanced Configuration

### Custom Base Map

Replace MapTiler with your own style:

```typescript
// src/main.ts
style: {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{
    id: 'osm',
    type: 'raster',
    source: 'osm'
  }]
}
```

### Performance Optimization

**1. Enable GeoJSON Compression:**
```bash
# Compress your GeoJSON files
gzip -k processed_data/*.geojson
```

**2. Use PMTiles (Advanced):**
```bash
# Convert GeoJSON to PMTiles for faster loading
npm install -g @mapbox/tippecanoe
tippecanoe -o apelos.pmtiles -l apelos processed_data/apelos_clean.geojson
```

**3. Image Optimization:**
```bash
# Install optimization tools
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'
// ... add to plugins array
```

### Analytics Integration

**Google Analytics:**
```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Plausible (Privacy-friendly):**
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Monitoring & Analytics

### Vercel Analytics

```bash
npm install @vercel/analytics

# Add to src/main.ts
import { inject } from '@vercel/analytics';
inject();
```

### Performance Monitoring

**Lighthouse CI:**
```bash
# Install
npm install -D @lhci/cli

# Run
npx lhci autorun --upload.target=temporary-public-storage
```

### Error Tracking

**Sentry:**
```bash
npm install @sentry/browser

# src/main.ts
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

---

## Troubleshooting

### Build Fails

**Problem:** `Module not found` errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem:** TypeScript errors
```bash
# Solution: Check types
npm run type-check
# Fix reported errors
```

### Map Doesn't Load

**Problem:** Blank map or errors

1. **Check API Key:**
   ```bash
   # Verify key is set
   echo $VITE_MAPTILER_KEY
   
   # Check browser console for 401 errors
   ```

2. **Check CORS:**
   - MapTiler allows all domains by default
   - If using custom tiles, configure CORS

3. **Check Network:**
   - Open DevTools → Network tab
   - Look for failed requests
   - Verify GeoJSON loads

### Performance Issues

**Slow Loading:**

1. **Enable compression:**
   - Vercel/Netlify: automatic
   - Custom server: check gzip config

2. **Reduce GeoJSON size:**
   ```bash
   # Simplify geometry
   npm install -g mapshaper
   mapshaper input.geojson -simplify 10% -o output.geojson
   ```

3. **Use CDN:**
   - Host GeoJSON on CDN
   - Update fetch URL in code

### Deployment Issues

**GitHub Actions Fails:**
```bash
# Check workflow file
cat .github/workflows/deploy.yml

# Verify secrets are set
# Settings → Secrets → Actions
```

**Vercel Build Fails:**
- Check build logs in dashboard
- Verify Node version matches (20+)
- Check environment variables

**Custom Domain Not Working:**
```bash
# Verify DNS records
dig your-domain.com

# Wait for propagation (up to 48 hours)
# Use https://dnschecker.org
```

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use platform secrets for API keys
- Rotate keys periodically

### 2. Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.maptiler.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https://*.maptiler.com; 
               connect-src 'self' https://api.maptiler.com;">
```

### 3. HTTPS Only
- All modern platforms enforce HTTPS
- Redirect HTTP → HTTPS in nginx config

### 4. Rate Limiting
```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

location / {
    limit_req zone=mylimit burst=20;
}
```

---

## Cost Optimization

### Free Tier Limits

| Platform | Free Tier | Bandwidth | Build Minutes |
|----------|-----------|-----------|---------------|
| **Vercel** | 100GB/month | Unlimited sites | 6000 min/month |
| **Netlify** | 100GB/month | Unlimited sites | 300 min/month |
| **GitHub Pages** | 100GB/month | 1 site | Unlimited |
| **MapTiler** | 100k tiles/month | - | - |

### Optimization Tips

1. **Cache GeoJSON:**
   - Set long cache headers
   - Use CDN for static files

2. **Lazy Load:**
   - Load data only when visible
   - Use intersection observer

3. **Monitor Usage:**
   - Track API calls
   - Set up alerts for limits

---

## Next Steps

1. **Custom Domain**
   - Purchase domain from Namecheap, Google Domains, etc.
   - Configure DNS with your platform

2. **SEO Optimization**
   - Add meta tags
   - Submit sitemap to Google
   - Create robots.txt

3. **User Feedback**
   - Add contact form
   - Integrate analytics
   - Gather user insights

4. **Continuous Improvement**
   - Monitor performance
   - Update dependencies
   - Add new features

---

## Support

- **Documentation:** See `web/README.md`
- **Issues:** Open GitHub issue
- **Community:** Join mapping forums

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [MapLibre GL JS Docs](https://maplibre.org/)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Pages Docs](https://docs.github.com/pages)

---

**Happy Deploying! 🚀**

