# 💻 Development Setup Guide

Complete guide to setting up your development environment for the Estado Novo Mapping Project.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing & Quality](#testing--quality)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**Node.js 20+**
- Download: https://nodejs.org/
- Verify: `node -v` (should show 20.x.x or higher)
- Verify: `npm -v` (should show 10.x.x or higher)

**Git**
- Download: https://git-scm.com/
- Verify: `git --version`

**MapTiler API Key**
- Sign up: https://www.maptiler.com/cloud/
- Free tier: 100,000 tile loads/month
- Get key: Account → Keys → Copy your API key

### Optional Tools

**VS Code (Recommended)**
- Download: https://code.visualstudio.com/
- Extensions: TypeScript, Vite, GitLens

**Docker (For containerized development)**
- Download: https://www.docker.com/
- Verify: `docker --version`

---

## Environment Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/eu-cristofer/geo.git
cd geo

# Check out the latest version
git checkout main
git pull origin main
```

### 2. Install Dependencies

```bash
# Navigate to web directory
cd web

# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your API key
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# MapTiler API Key (Required)
VITE_MAPTILER_KEY=your_actual_maptiler_key_here

# Optional customization
VITE_APP_TITLE=Estado Novo - Mapeamento dos Apelos
VITE_APP_DESCRIPTION=Mapa interativo dos apelos de desapropriação
```

### 4. Verify Setup

```bash
# Check TypeScript configuration
npm run type-check

# Test development server
npm run dev

# Should start server at http://localhost:3000
# Press Ctrl+C to stop
```

---

## Project Structure

### Web Application Structure

```
web/
├── public/                    # Static assets
│   └── data/                  # GeoJSON data files
│       ├── apelos_clean.geojson
│       └── filtro_bairros.geojson
├── src/                       # Source code
│   ├── main.ts               # Application entry point
│   ├── style.css             # Global styles
│   └── vite-env.d.ts         # TypeScript definitions
├── index.html                # HTML template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Build configuration
├── .env                      # Environment variables
├── .env.example              # Environment template
├── Dockerfile                # Docker container
├── docker-compose.yml        # Docker orchestration
├── nginx.conf                # Nginx configuration
├── vercel.json               # Vercel deployment
└── netlify.toml              # Netlify deployment
```

### Key Files Explained

**`src/main.ts`** - Main application logic
- Map initialization
- Layer management
- User interactions
- Popup creation

**`src/style.css`** - All styling
- Layout and responsive design
- Layer control styling
- Animations and transitions

**`index.html`** - HTML template
- Sidebar structure
- Meta tags and SEO
- Initial layout

**`package.json`** - Project configuration
- Dependencies and scripts
- Build configuration
- Development tools

**`vite.config.ts`** - Build configuration
- Development server settings
- Build optimization
- Plugin configuration

---

## Development Workflow

### 1. Start Development Server

```bash
# Start development server with hot reload
npm run dev

# Server runs at http://localhost:3000
# Changes auto-reload in browser
# Press Ctrl+C to stop
```

### 2. Make Changes

**Edit TypeScript files:**
- `src/main.ts` - Application logic
- `src/style.css` - Styling
- `index.html` - HTML structure

**Add data files:**
- Place GeoJSON files in `public/data/`
- Update `LAYERS` array in `main.ts`

### 3. Test Changes

```bash
# Type checking
npm run type-check

# Build test
npm run build

# Preview production build
npm run preview
# Visit http://localhost:4173
```

### 4. Code Quality

```bash
# Check for TypeScript errors
npm run type-check

# Format code (if configured)
npm run format

# Lint code (if configured)
npm run lint
```

---

## Testing & Quality

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Should show no errors
# Fix any reported type errors
```

### Build Testing

```bash
# Test production build
npm run build

# Should complete without errors
# Check dist/ folder for output
```

### Browser Testing

**Desktop Browsers:**
- Chrome (latest) - Recommended
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Mobile Testing:**
- Chrome DevTools device emulation
- Actual mobile devices
- iOS Safari
- Android Chrome

### Performance Testing

```bash
# Build and test performance
npm run build
npm run preview

# Use Lighthouse in Chrome DevTools
# Target: 90+ scores across all metrics
```

---

## Development Best Practices

### TypeScript Usage

```typescript
// Use proper typing
interface LayerConfig {
  id: string;
  name: string;
  file: string;
  type: 'point' | 'polygon' | 'line';
  visible: boolean;
  color: string;
  category: 'main' | 'context';
}

// Avoid 'any' type
// Use specific types instead
```

### Code Organization

```typescript
// Keep functions focused and small
private createPopupContent(props: Record<string, unknown>): string {
  // Single responsibility
  // Clear naming
  // Proper documentation
}

// Use meaningful variable names
const mapContainer = document.getElementById('map');
const layerControl = document.querySelector('.layer-control');
```

### Error Handling

```typescript
// Handle async operations properly
try {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Failed to load data:', error);
  // Provide fallback or user feedback
}
```

---

## Common Development Tasks

### Add New Data Layer

1. **Add GeoJSON file:**
   ```bash
   cp new-data.geojson web/public/data/
   ```

2. **Update LAYERS array in `src/main.ts`:**
   ```typescript
   {
     id: 'new-layer',
     name: 'New Layer Name',
     file: 'new-data.geojson',
     type: 'point',
     visible: false,
     color: '#FF0000',
     category: 'main',
   }
   ```

3. **Test changes:**
   ```bash
   npm run dev
   # Check layer appears in control panel
   ```

### Change Map Styling

1. **Edit colors in `src/style.css`:**
   ```css
   :root {
     --primary-color: #C1272D;
     --secondary-color: #E8862E;
   }
   ```

2. **Or modify layer colors in `src/main.ts`:**
   ```typescript
   color: '#YOUR_HEX_COLOR'
   ```

### Update Map Configuration

```typescript
// Edit MAP_CONFIG in src/main.ts
const MAP_CONFIG = {
  center: [-43.1895, -22.9068],  // [longitude, latitude]
  zoom: 13,                       // Initial zoom (0-22)
  pitch: 0,                       // 3D tilt (0-60)
  bearing: 0,                     // Rotation (0-360)
};
```

---

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill

# Or use different port
npm run dev -- --port 3001
```

**Module not found errors:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Check for type errors
npm run type-check

# Fix reported errors
# Common fixes:
# - Add proper type annotations
# - Import missing types
# - Fix interface definitions
```

**Map not loading:**
```bash
# Check API key
cat .env
# Should show VITE_MAPTILER_KEY=your_key

# Check browser console for errors
# Look for 401 Unauthorized errors
```

**Build fails:**
```bash
# Check for syntax errors
npm run type-check

# Check for missing dependencies
npm list --depth=0

# Clean build
rm -rf dist/
npm run build
```

### Debug Mode

Enable detailed logging:

```typescript
// Add to src/main.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Map config:', MAP_CONFIG);
  console.log('Layers:', LAYERS);
  console.log('Map loaded:', this.map?.loaded());
}
```

---

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "files.associations": {
    "*.geojson": "json"
  }
}
```

### Recommended Extensions

- **TypeScript Importer** - Auto-import TypeScript modules
- **Vite** - Vite development support
- **GitLens** - Git integration
- **Prettier** - Code formatting
- **ESLint** - Code linting

---

## Next Steps

After completing development setup:

1. **Read the [Complete Documentation](complete-documentation.md)** - Full technical reference
2. **Try the [Customization Guide](customization.md)** - Learn to modify features
3. **Check the [Deployment Guide](../deployment/deployment-guide.md)** - Deploy to production
4. **Use the [Quick Reference](../reference/quick-reference.md)** - Daily command lookup

---

## Getting Help

**Development Issues:**
- Check this guide's troubleshooting section
- Read the [Complete Documentation](complete-documentation.md)
- Open a GitHub issue for bugs

**Contact:**
- **Francesca:** arq.francesca.martinelli@gmail.com
- **Cristofer:** cristofercosta@yahoo.com.br

---

**Happy coding! 🚀**

*Last Updated: October 2025*
