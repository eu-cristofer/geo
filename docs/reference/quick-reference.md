# ⚡ Quick Reference Guide

Fast lookup for common tasks and commands.

## 🚀 Getting Started

```bash
# Clone and setup
git clone https://github.com/eu-cristofer/geo.git
cd geo/web
npm install
cp env.example .env
# Add your MapTiler API key to .env
npm run dev
```

## 📦 Essential Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript errors
```

### Deployment
```bash
# Vercel (fastest)
vercel --prod

# Netlify
netlify deploy --prod

# GitHub Pages
git push origin main  # Auto-deploys via Actions

# Docker
docker-compose up -d
```

## 🗺️ Map Configuration

### Initial View
```typescript
// src/main.ts
const MAP_CONFIG = {
  center: [-43.1895, -22.9068],  // [lng, lat]
  zoom: 13,                       // 0-22
  pitch: 0,                       // 0-60
  bearing: 0,                     // 0-360
};
```

### Add Layer
```typescript
// Add to LAYERS array in src/main.ts
{
  id: 'my-layer',
  name: 'Display Name',
  file: 'data.geojson',          // In public/data/
  type: 'point',                 // point|polygon|line
  visible: true,
  color: '#FF0000',
  category: 'main',
}
```

## 🎨 Styling

### Colors
```css
/* src/style.css */
:root {
  --primary-color: #C1272D;
  --secondary-color: #E8862E;
  --accent-color: #E8B931;
}
```

### Layer Colors
```typescript
// src/main.ts - In LAYERS array
color: '#C1272D',  // Change this
```

## 🔧 Common Tasks

### Update Data
```bash
# 1. Add new GeoJSON to web/public/data/
cp new-data.geojson web/public/data/

# 2. Add to LAYERS in src/main.ts

# 3. Rebuild
npm run build
```

### Change Map Tiles
```typescript
// src/main.ts - In constructor
style: 'https://api.maptiler.com/maps/STYLE/style.json?key=${KEY}'
// Replace STYLE with: streets-v2, outdoor-v2, satellite, etc.
```

### Modify Popups
```typescript
// src/main.ts - createPopupContent method
return `
  <div class="popup-content">
    <h3>${props.Name}</h3>
    <p>${props.Description}</p>
    <!-- Add custom content here -->
  </div>
`;
```

## 🐛 Troubleshooting

### Map Not Loading
```bash
# Check API key
cat web/.env

# Verify in browser console (F12)
# Look for 401 errors

# Rebuild
npm run build
```

### Data Not Appearing
```bash
# Check files exist
ls web/public/data/

# Validate GeoJSON
# Visit http://geojson.io
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run type-check
```

### Deployment Failed
```bash
# GitHub Pages: Check secrets
# Settings → Secrets → VITE_MAPTILER_KEY

# Vercel: Check environment variables
vercel env ls

# Check logs
# GitHub: Actions tab
# Vercel: Dashboard → Deployments
```

## 📱 Browser Testing

### Desktop
- Chrome/Edge: F12 → Console
- Firefox: Ctrl+Shift+K
- Safari: Cmd+Option+C

### Mobile
- Chrome Remote Debugging
- Safari Web Inspector (iOS)
- Use responsive mode: F12 → Toggle device toolbar

## 🔐 Environment Variables

### Local (.env)
```env
VITE_MAPTILER_KEY=your_key_here
VITE_APP_TITLE=Your Title
VITE_APP_DESCRIPTION=Your Description
```

### Vercel
```bash
vercel env add VITE_MAPTILER_KEY production
```

### GitHub
```
Settings → Secrets → Actions → New repository secret
Name: VITE_MAPTILER_KEY
Value: your_key
```

### Netlify
```bash
netlify env:set VITE_MAPTILER_KEY your_key
```

## 📊 Performance Optimization

### Simplify GeoJSON
```bash
npm install -g mapshaper
mapshaper input.geojson -simplify 10% -o output.geojson
```

### Reduce Clustering
```typescript
// src/main.ts
clusterRadius: 30,      // Smaller = less clustering
clusterMaxZoom: 14,     // Lower = cluster longer
```

### Enable Compression
```typescript
// vite.config.ts (already configured)
viteCompression({
  algorithm: 'brotliCompress',
  ext: '.br',
})
```

## 🌐 Deployment URLs

### After Deployment
- **Vercel**: `https://PROJECT.vercel.app`
- **Netlify**: `https://PROJECT.netlify.app`
- **GitHub Pages**: `https://USERNAME.github.io/REPO/`

### Custom Domain
All platforms support custom domains for free.

## 📝 File Locations

| What | Where |
|------|-------|
| Main logic | `web/src/main.ts` |
| Styles | `web/src/style.css` |
| HTML | `web/index.html` |
| Data files | `web/public/data/*.geojson` |
| Config | `web/vite.config.ts` |
| Types | `web/src/vite-env.d.ts` |
| Environment | `web/.env` |
| Workflow | `.github/workflows/deploy.yml` |

## 🔗 Important Links

### Documentation
- Full Docs: `DOCUMENTATION.md`
- User Guide: `USER_GUIDE.md`
- Deployment: `DEPLOYMENT.md`
- Quick Deploy: `QUICK_DEPLOY.md`

### External Resources
- [MapLibre Docs](https://maplibre.org/maplibre-gl-js-docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [GeoJSON Spec](https://geojson.org/)

### Tools
- [GeoJSON.io](http://geojson.io/) - Validate GeoJSON
- [Mapshaper](https://mapshaper.org/) - Simplify geometries
- [MapTiler](https://www.maptiler.com/cloud/) - Get API key

## ⌨️ Keyboard Shortcuts

### Development
| Command | Mac | Windows/Linux |
|---------|-----|---------------|
| Dev Tools | `Cmd+Option+I` | `F12` or `Ctrl+Shift+I` |
| Refresh | `Cmd+R` | `Ctrl+R` |
| Hard Refresh | `Cmd+Shift+R` | `Ctrl+Shift+R` |
| Search Files | `Cmd+P` | `Ctrl+P` |

### Map Navigation
| Action | Shortcut |
|--------|----------|
| Zoom In | `+` or `=` |
| Zoom Out | `-` |
| Pan | Arrow keys |
| Rotate | `Shift + Drag` |
| Close Popup | `Esc` |

## 🆘 Quick Help

### Common Errors

**"VITE_MAPTILER_KEY is not defined"**
→ Add key to `.env` file

**"Cannot find module"**
→ Run `npm install`

**"Port 3000 already in use"**
→ Kill process: `lsof -ti:3000 | xargs kill`

**TypeScript errors**
→ Run `npm run type-check` and fix errors

**Build fails**
→ Delete `node_modules`, run `npm install`

### Get Support
- 📧 Francesca: arq.francesca.martinelli@gmail.com
- 📧 Cristofer: cristofercosta@yahoo.com.br
- 🐛 GitHub: Open an issue
- 📚 Docs: Read DOCUMENTATION.md

## 🎯 Common Use Cases

### 1. Add New Data Layer
```bash
# Copy data
cp new.geojson web/public/data/

# Edit src/main.ts - Add to LAYERS array
# Build and deploy
npm run build
```

### 2. Change Colors
```css
/* Edit web/src/style.css */
:root {
  --primary-color: #YOUR_COLOR;
}
```

### 3. Update Map View
```typescript
/* Edit src/main.ts */
center: [YOUR_LNG, YOUR_LAT],
zoom: YOUR_ZOOM,
```

### 4. Deploy Update
```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

**💡 Tip:** Bookmark this page for quick access to common commands!


