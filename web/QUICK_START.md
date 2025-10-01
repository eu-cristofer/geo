# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/geo.git

# Navigate to web directory
cd geo/web

# Install dependencies
npm install
```

### Step 2: Get MapTiler API Key

1. Visit [https://maptiler.com/cloud/](https://maptiler.com/cloud/)
2. Create a free account
3. Copy your API key from the dashboard

### Step 3: Configure Environment

```bash
# Copy the environment template
cp env.example .env

# Edit .env and add your key
echo "VITE_MAPTILER_KEY=your_api_key_here" > .env
```

### Step 4: Run Development Server

```bash
npm run dev
```

Your app will open at [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
web/
├── src/
│   ├── main.ts       ← Application logic
│   └── style.css     ← Styling
├── public/
│   └── data/         ← GeoJSON files
├── dist/             ← Build output
└── index.html        ← HTML template
```

---

## 🎯 Common Tasks

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Preview Production Build

```bash
npm run preview
```

### Type Check

```bash
npm run type-check
```

### Lint Code

```bash
npm run lint
```

---

## 🌐 Deploy

### Vercel (Easiest)

```bash
npm install -g vercel
vercel
```

Add `VITE_MAPTILER_KEY` in Vercel dashboard.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add environment variable in Netlify dashboard.

### GitHub Pages

1. Enable Pages in repo settings
2. Add `VITE_MAPTILER_KEY` to GitHub Secrets
3. Push to main branch

---

## 🔧 Customize

### Change Map Center

Edit `src/main.ts`:

```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068], // [longitude, latitude]
  zoom: 13,
}
```

### Add New Layer

Edit `src/main.ts`:

```typescript
const LAYERS: LayerConfig[] = [
  // ... existing layers
  {
    id: 'my-layer',
    name: 'My Layer',
    file: 'my-data.geojson',  // Place in public/data/
    type: 'point',            // or 'polygon', 'line'
    visible: true,
    color: '#FF5733',
    category: 'main',
  }
]
```

### Change Colors

Edit `src/style.css`:

```css
:root {
  --primary-color: #C1272D;
  --secondary-color: #E8862E;
  --accent-color: #E8B931;
}
```

---

## 📚 Learn More

- [Full Documentation](./DOCUMENTATION.md)
- [API Reference](./API_REFERENCE.md)
- [MapLibre Docs](https://maplibre.org/maplibre-gl-js-docs/)

---

## ❓ Troubleshooting

### Issue: Map doesn't load

**Solution**: Check that `VITE_MAPTILER_KEY` is set correctly in `.env`

### Issue: Layers not appearing

**Solution**: 
1. Verify GeoJSON files are in `public/data/`
2. Check browser console for errors
3. Validate GeoJSON at [geojson.io](https://geojson.io)

### Issue: Build fails

**Solution**:
```bash
rm -rf node_modules
npm install
npm run build
```

---

## 💡 Tips

1. **Use Environment Variables**: Never commit API keys to Git
2. **Check Console**: Browser DevTools shows helpful error messages
3. **Hot Reload**: Save files to see changes instantly
4. **Mobile Testing**: Use browser DevTools device emulation

---

## 🆘 Need Help?

- Open an [Issue](https://github.com/yourusername/geo/issues)
- Check [Discussions](https://github.com/yourusername/geo/discussions)
- Read the [FAQ](./DOCUMENTATION.md#troubleshooting)

---

*Happy Mapping! 🗺️*


