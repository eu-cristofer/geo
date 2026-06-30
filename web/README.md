# Estado Novo - Mapeamento dos Apelos

Interactive web map displaying historical appeals during the Estado Novo period in Rio de Janeiro, related to expropriations for Avenida Presidente Vargas construction.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Development

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Get a MapTiler API key** (free tier available)
   - Visit https://www.maptiler.com/cloud/
   - Create an account and get your API key
   - Copy `.env.example` to `.env`
   - Add your key: `VITE_MAPTILER_KEY=your_key_here`

3. **Run development server**
   ```bash
   npm run dev
   ```
   
   Opens at http://localhost:3000

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## 📦 Deployment Options

### Option 1: Vercel (Recommended)

**Easiest deployment with automatic CI/CD**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd web
   vercel
   ```

3. Follow prompts and add your `VITE_MAPTILER_KEY` as environment variable

**Or use Vercel Dashboard:**
- Connect your GitHub repository at https://vercel.com
- Set build command: `npm run build`
- Set output directory: `dist`
- Add environment variable: `VITE_MAPTILER_KEY`

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   cd web
   netlify deploy --prod
   ```

**Or use Netlify Dashboard:**
- Connect repository at https://netlify.com
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variable: `VITE_MAPTILER_KEY`

### Option 3: GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: GitHub Actions

2. **Add Secret**
   - Settings → Secrets → Actions
   - Add: `VITE_MAPTILER_KEY` with your API key

3. **Push to main branch**
   ```bash
   git push origin main
   ```
   
   GitHub Actions will automatically build and deploy

4. **Access your site**
   - https://yourusername.github.io/geo/

### Option 4: Custom Server (VPS/Cloud)

**For nginx:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload `dist/` to your server

3. Configure nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/apelos-map;
       index index.html;

       # Enable gzip
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/geo+json;

       # Cache static assets
       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # GeoJSON files
       location ~* \.geojson$ {
           add_header Content-Type application/geo+json;
           expires 1h;
       }

       # SPA fallback
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. Restart nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Option 5: Docker

**Dockerfile included for containerized deployment**

```bash
cd web
docker build -t apelos-map .
docker run -p 8080:80 apelos-map
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_MAPTILER_KEY` | MapTiler API key for the vector base maps | Yes |
| `VITE_STADIA_KEY` | Stadia Maps key for the "Aquarela" (Stamen Watercolor) base map. Optional — works key-less on localhost; needed only for the deployed site | No |
| `VITE_APP_TITLE` | Application title | No |
| `VITE_APP_DESCRIPTION` | App description | No |

### Customization

**Map Configuration** (`src/main.ts`):
```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068], // Initial center
  zoom: 13,                      // Initial zoom level
  pitch: 0,                      // 3D tilt
  bearing: 0,                    // Rotation
};
```

**Styling** (`src/style.css`):
```css
:root {
  --primary-color: #C1272D;    // Main theme color
  --secondary-color: #E8862E;  // Secondary color
  --accent-color: #E8B931;     // Accent color
}
```

## 🏗️ Project Structure

```
web/
├── src/
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Build configuration
├── tsconfig.json        # TypeScript config
├── package.json         # Dependencies
├── vercel.json          # Vercel config
└── netlify.toml         # Netlify config
```

## 🎨 Features

- **Interactive Clustering**: Points cluster at lower zoom levels
- **Detailed Popups**: Click points to view appeal details
- **Responsive Design**: Works on desktop and mobile
- **Fast Performance**: Optimized builds with code splitting
- **SEO Friendly**: Meta tags for social sharing
- **Accessible**: WCAG compliant design

## 🛠️ Tech Stack

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **MapLibre GL JS**: Open-source map rendering
- **MapTiler**: Map tiles and styling

## 📊 Performance

- **First Load**: < 100KB (gzipped)
- **Time to Interactive**: < 2s on 3G
- **Lighthouse Score**: 95+ (all metrics)

## 🔒 Security

- HTTPS enforced on all platforms
- CSP headers configured
- No sensitive data in frontend
- Environment variables for API keys

## 📝 License

MIT License - See LICENSE file for details

## 👥 Authors

- Francesca Dalmagro Martinelli
- Cristofer Antoni Souza Costa

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 📧 Support

For questions or issues, please open a GitHub issue.

## 📚 Complete Documentation

For comprehensive guides, see the main documentation:

- **[📚 Documentation Hub](../docs/README.md)** - Central documentation index
- **[👤 User Guide](../docs/user-guides/user-guide.md)** - How to use the map
- **[💻 Developer Setup](../docs/developer-guides/development-setup.md)** - Development environment
- **[🚀 Deployment Guide](../docs/deployment/deployment-guide.md)** - All deployment options
- **[⚡ Quick Reference](../docs/reference/quick-reference.md)** - Command lookup
- **[📋 API Reference](../docs/api/api-reference.md)** - Technical reference

