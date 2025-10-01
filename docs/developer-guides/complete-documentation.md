# 📚 Complete Documentation - Estado Novo Mapping Project

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Development Guide](#development-guide)
5. [Layer Configuration](#layer-configuration)
6. [Deployment Guide](#deployment-guide)
7. [Customization](#customization)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)
11. [FAQ](#faq)

---

## Project Overview

### What is This Project?

This is an interactive web mapping application that displays historical appeals (apelos) from the Estado Novo period in Rio de Janeiro, Brazil. The map shows locations of properties affected by expropriations during the construction of Avenida Presidente Vargas.

### Key Features

✅ **Interactive Map**
- Clustering of appeal points at different zoom levels
- Click to view detailed information about each appeal
- Links to original historical documents

✅ **Multiple Layers**
- Appeals (Apelos) - Main historical data
- Filtered Neighborhoods (Bairros Filtrados) - Context polygons

✅ **Professional UI**
- Collapsible layer control panel
- Responsive design for all devices
- Modern, accessible interface

✅ **Production-Ready**
- TypeScript for type safety
- Optimized builds (~180KB Brotli compressed)
- CI/CD pipeline for automated deployments
- Multiple deployment options

### Technologies Used

**Frontend:**
- Vite 5.4 - Build tool and dev server
- TypeScript 5.6 - Type-safe JavaScript
- MapLibre GL JS 4.7 - Map rendering engine
- MapTiler - Map tiles provider

**Infrastructure:**
- GitHub Actions - CI/CD
- Docker - Containerization
- Nginx - Web server (for VPS deployments)

**Data Processing:**
- Python 3.12+
- GeoPandas - Geospatial data manipulation
- QGIS - Desktop GIS software

---

## Architecture

### Project Structure

```
geo/
├── web/                          # Web application
│   ├── public/                   # Static assets
│   │   └── data/                 # GeoJSON data files
│   │       ├── apelos_clean.geojson
│   │       └── filtro_bairros.geojson
│   ├── src/                      # Source code
│   │   ├── main.ts              # Application entry point
│   │   ├── style.css            # Global styles
│   │   └── vite-env.d.ts        # TypeScript definitions
│   ├── index.html               # HTML template
│   ├── package.json             # Dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── vite.config.ts           # Build configuration
│   ├── Dockerfile               # Docker container
│   ├── docker-compose.yml       # Docker orchestration
│   ├── nginx.conf               # Nginx configuration
│   ├── vercel.json              # Vercel deployment
│   └── netlify.toml             # Netlify deployment
├── processed_data/               # Clean GeoJSON data
│   ├── apelos_clean.geojson
│   └── filtro_bairros.geojson
├── raw_data/                     # Original data files
├── DATA.RIO/                     # Rio municipal data
├── src/geoprocess/               # Python utilities
├── .github/workflows/            # CI/CD pipelines
│   └── deploy.yml
├── process.ipynb                 # Data processing notebook
├── apelos.qgz                    # QGIS project
├── pyproject.toml               # Python package config
├── README.md                     # Project overview
└── DOCUMENTATION.md             # This file
```

### Application Flow

```
1. User loads page
   ↓
2. MapTiler API provides base map tiles
   ↓
3. GeoJSON data loads from /data/
   ↓
4. Map renders with clustering
   ↓
5. User interacts:
   - Click clusters → zoom in
   - Click points → show popup
   - Toggle layers → visibility changes
   ↓
6. Updates reflected in real-time
```

### Data Flow

```
Raw KML/Historical Documents
         ↓
  [process.ipynb]
         ↓
Cleaned GeoJSON (processed_data/)
         ↓
  [Copy to web/public/data/]
         ↓
  [Build Process]
         ↓
Optimized Bundle (dist/)
         ↓
   [Deployment]
         ↓
   Live Website
```

---

## Getting Started

### Prerequisites

**Required:**
- Node.js 20+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git
- MapTiler API key ([Get free key](https://www.maptiler.com/cloud/))

**Optional:**
- Docker (for containerized deployment)
- Python 3.12+ (for data processing)
- QGIS (for desktop GIS work)

### Quick Start (5 minutes)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eu-cristofer/geo.git
   cd geo/web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp env.example .env
   nano .env  # Add your MapTiler API key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Visit http://localhost:3000

### Detailed Setup

#### 1. Get MapTiler API Key

1. Visit https://www.maptiler.com/cloud/
2. Sign up for free account
3. Go to **Account → Keys**
4. Copy your API key
5. Free tier includes 100,000 tile loads/month

#### 2. Environment Configuration

Create `.env` file in `web/` directory:

```env
# MapTiler API Key (Required)
VITE_MAPTILER_KEY=your_actual_key_here

# Optional customization
VITE_APP_TITLE=Estado Novo - Mapeamento dos Apelos
VITE_APP_DESCRIPTION=Mapa interativo dos apelos de desapropriação
```

#### 3. Verify Installation

```bash
# Check Node.js version (should be 20+)
node -v

# Check npm version
npm -v

# Install dependencies
npm install

# Run type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Development Guide

### Development Workflow

#### 1. Local Development

```bash
# Start dev server with hot reload
npm run dev

# Server runs at http://localhost:3000
# Changes auto-reload in browser
```

#### 2. Project Structure

**Core Files:**

- `src/main.ts` - Main application logic
  - Map initialization
  - Layer management
  - User interactions
  - Popup creation

- `src/style.css` - All styling
  - Layout
  - Layer control
  - Responsive design
  - Animations

- `index.html` - HTML template
  - Sidebar structure
  - Meta tags
  - Initial layout

#### 3. Making Changes

**Add a new data layer:**

1. Add GeoJSON file to `public/data/`
2. Update `LAYERS` array in `main.ts`:
   ```typescript
   {
     id: 'my-layer',
     name: 'My Layer Name',
     file: 'my-data.geojson',
     type: 'point' | 'polygon' | 'line',
     visible: true,
     color: '#FF0000',
     category: 'main',
   }
   ```
3. Rebuild and test

**Change map styling:**

1. Edit colors in `style.css`:
   ```css
   :root {
     --primary-color: #C1272D;
     --secondary-color: #E8862E;
   }
   ```

2. Or modify layer colors in `main.ts`:
   ```typescript
   color: '#YOUR_HEX_COLOR'
   ```

**Modify map behavior:**

Edit `MAP_CONFIG` in `main.ts`:
```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068],  // [longitude, latitude]
  zoom: 13,                       // Initial zoom (0-22)
  pitch: 0,                       // 3D tilt (0-60)
  bearing: 0,                     // Rotation (0-360)
};
```

#### 4. Testing

**Type checking:**
```bash
npm run type-check
```

**Build test:**
```bash
npm run build
```

**Local preview:**
```bash
npm run preview
# Visit http://localhost:4173
```

**Browser testing:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

#### 5. Code Quality

**TypeScript configuration:**
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Best practices:**
- Use TypeScript types
- Follow existing code style
- Comment complex logic
- Keep functions focused
- Test on multiple browsers

---

## Layer Configuration

### Layer System Overview

Layers are configured in the `LAYERS` array in `src/main.ts`. Each layer has specific properties that control its behavior and appearance.

### Layer Configuration Object

```typescript
interface LayerConfig {
  id: string;           // Unique identifier
  name: string;         // Display name in layer control
  file: string;         // GeoJSON filename in public/data/
  type: 'point' | 'polygon' | 'line';  // Geometry type
  visible: boolean;     // Initial visibility
  color: string;        // Hex color code
  category: 'main' | 'context';  // Layer category
}
```

### Current Layers

#### Apelos (Appeals)
```typescript
{
  id: 'apelos',
  name: 'Apelos (Appeals)',
  file: 'apelos_clean.geojson',
  type: 'point',
  visible: true,
  color: '#C1272D',  // Red
  category: 'main',
}
```

**Features:**
- Point clustering at low zoom levels
- Graduated cluster sizes (small/medium/large)
- Click to expand clusters
- Click points for detailed popups
- Hover effects
- Links to original documents

**Cluster Configuration:**
- Radius: 50 pixels
- Max zoom: 16
- Color gradient: Yellow → Orange → Red

#### Bairros Filtrados (Filtered Neighborhoods)
```typescript
{
  id: 'filtro-bairros',
  name: 'Bairros Filtrados (Filtered Neighborhoods)',
  file: 'filtro_bairros.geojson',
  type: 'polygon',
  visible: false,
  color: '#E8862E',  // Orange
  category: 'main',
}
```

**Features:**
- Polygon fill (20% opacity)
- Outlined borders (80% opacity, 2px width)
- Hidden by default
- Toggle via layer control

### Adding Custom Layers

#### Example: Add a Line Layer

1. **Prepare GeoJSON data:**
   ```bash
   cp your-data.geojson web/public/data/
   ```

2. **Add to LAYERS array:**
   ```typescript
   const LAYERS: LayerConfig[] = [
     // ... existing layers
     {
       id: 'my-roads',
       name: 'Historic Roads',
       file: 'roads.geojson',
       type: 'line',
       visible: false,
       color: '#3498DB',
       category: 'main',
     },
   ];
   ```

3. **Rebuild:**
   ```bash
   npm run build
   ```

### Layer Types and Rendering

#### Point Layers
- Rendered as circles
- Support clustering
- Can have hover effects
- Click handlers for popups

#### Polygon Layers
- Two sub-layers: fill and outline
- Configurable opacity
- Border width and color
- Fill pattern support

#### Line Layers
- Single line layer
- Width and opacity control
- Dash patterns supported
- Can represent roads, boundaries, etc.

### Layer Styling

Each layer type has default styling that can be customized:

**Points:**
```typescript
'circle-color': layer.color,
'circle-radius': 6,
'circle-stroke-width': 2,
'circle-stroke-color': '#fff',
'circle-opacity': 0.8,
```

**Polygons:**
```typescript
// Fill
'fill-color': layer.color,
'fill-opacity': 0.2,

// Outline
'line-color': layer.color,
'line-width': 2,
'line-opacity': 0.8,
```

**Lines:**
```typescript
'line-color': layer.color,
'line-width': 1,
'line-opacity': 0.6,
```

### Data Format Requirements

#### GeoJSON Structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Name": "Location Name",
        "Description": "Details...",
        "Link": "https://..."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-43.2187, -22.9120, 0.0]
      }
    }
  ]
}
```

#### Property Requirements

**Apelos layer:**
- `Name` - Location identifier (required)
- `Description` - Full description (required)
- `Link` - URL to document (optional)

**Other layers:**
- Custom properties supported
- Access via `feature.properties.yourProperty`

---

## Deployment Guide

### Deployment Options Comparison

| Platform | Difficulty | Cost | Build Time | Auto-Deploy | Custom Domain |
|----------|-----------|------|------------|-------------|---------------|
| **Vercel** | ⭐ Easy | Free | ~60s | ✅ Yes | ✅ Free |
| **Netlify** | ⭐ Easy | Free | ~90s | ✅ Yes | ✅ Free |
| **GitHub Pages** | ⭐⭐ Medium | Free | ~2-3min | ✅ Yes | ✅ Free |
| **Docker/VPS** | ⭐⭐⭐ Hard | $5+/mo | ~5min | Manual | ✅ Yes |

### Recommended Deployment: Vercel

#### Why Vercel?
- Fastest deployment (60 seconds)
- Automatic HTTPS
- Global CDN
- Preview deployments for PRs
- Easy environment variables
- Excellent performance

#### Vercel Deployment Steps

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd web
   vercel
   ```

4. **Answer prompts:**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: apelos-map (or your choice)
   - Directory: ./ (current)
   - Override settings: No

5. **Add environment variable:**
   ```bash
   vercel env add VITE_MAPTILER_KEY production
   # Paste your MapTiler API key when prompted
   ```

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

7. **Done!** Your site is live at the provided URL.

#### Vercel Dashboard Setup

Alternative to CLI:

1. Go to https://vercel.com
2. Click "Import Project"
3. Connect GitHub repository
4. Configure:
   - Framework: Vite
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - Name: `VITE_MAPTILER_KEY`
   - Value: Your API key
6. Deploy

### GitHub Pages Deployment

#### Prerequisites
- Repository on GitHub
- GitHub Actions enabled

#### Setup Steps

1. **Enable GitHub Pages:**
   - Go to repository Settings
   - Navigate to Pages
   - Source: **GitHub Actions**
   - Save

2. **Add Repository Secret:**
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_MAPTILER_KEY`
   - Value: Your MapTiler API key
   - Click "Add secret"

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Monitor:**
   - Go to Actions tab
   - Watch workflow run
   - Should complete in 2-3 minutes

5. **Access:**
   - Your site: `https://username.github.io/geo/`

#### Workflow Configuration

The workflow is already configured in `.github/workflows/deploy.yml`:

```yaml
- Triggers on push to main
- Copies data files
- Installs dependencies
- Runs type check
- Builds production bundle
- Deploys to GitHub Pages
```

### Netlify Deployment

#### Via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize and deploy
cd web
netlify init

# Deploy to production
netlify deploy --prod
```

#### Via Dashboard

1. Visit https://app.netlify.com
2. "New site from Git"
3. Choose your repository
4. Configure:
   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/dist`
5. Add environment variable:
   - Key: `VITE_MAPTILER_KEY`
   - Value: Your API key
6. Deploy

### Docker Deployment

#### Local Testing

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
# Create .env file
echo "VITE_MAPTILER_KEY=your_key" > .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production VPS (Ubuntu)

1. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Clone and deploy:**
   ```bash
   git clone https://github.com/eu-cristofer/geo.git
   cd geo/web
   echo "VITE_MAPTILER_KEY=your_key" > .env
   docker-compose up -d
   ```

3. **Configure Nginx (optional):**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   sudo nano /etc/nginx/sites-available/apelos-map
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/apelos-map /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Custom Domain Setup

#### Vercel

1. Go to project settings
2. Domains → Add
3. Enter your domain
4. Follow DNS configuration instructions
5. Wait for propagation (up to 48 hours)

#### Netlify

1. Domain settings → Add custom domain
2. Configure DNS:
   ```
   A Record: 75.2.60.5
   CNAME: yoursite.netlify.app
   ```

#### GitHub Pages

1. Repository Settings → Pages
2. Custom domain → Enter domain
3. Configure DNS:
   ```
   A Records:
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

---

## Customization

### Visual Customization

#### Color Scheme

Edit `web/src/style.css`:

```css
:root {
  --primary-color: #C1272D;      /* Main brand color */
  --secondary-color: #E8862E;    /* Secondary accent */
  --accent-color: #E8B931;       /* Tertiary accent */
  --text-dark: #2c3e50;          /* Dark text */
  --text-light: #666;            /* Light text */
  --bg-light: #f8f9fa;           /* Light backgrounds */
  --border-color: #e1e8ed;       /* Borders */
}
```

#### Typography

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
}

/* Or use Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

#### Layout Adjustments

**Sidebar width:**
```css
.sidebar {
  width: 380px;  /* Change this */
}
```

**Layer control position:**
```css
.layer-control {
  top: 1rem;    /* Distance from top */
  right: 1rem;  /* Distance from right */
  /* Or change to left: 1rem; for left side */
}
```

### Functional Customization

#### Map Initial View

```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068],  // Change coordinates
  zoom: 13,                       // 0-22 (higher = more zoomed)
  pitch: 0,                       // 0-60 (3D tilt)
  bearing: 0,                     // 0-360 (rotation)
};
```

#### Clustering Parameters

```typescript
this.map.addSource('apelos', {
  type: 'geojson',
  data: data,
  cluster: true,
  clusterMaxZoom: 16,     // Max zoom to cluster points
  clusterRadius: 50,      // Cluster radius in pixels
});
```

#### Popup Content

Edit `createPopupContent()` method in `main.ts`:

```typescript
private createPopupContent(props: Record<string, unknown>): string {
  const name = props.Name || 'Sem informação';
  const description = props.Description || 'Descrição não disponível';
  const link = props.Link;

  return `
    <div class="popup-content">
      <h3>${name}</h3>
      <p>${description}</p>
      ${link ? `<a href="${link}" target="_blank">Ver documento →</a>` : ''}
      
      <!-- Add custom fields here -->
      ${props.date ? `<p><strong>Data:</strong> ${props.date}</p>` : ''}
      ${props.location ? `<p><strong>Local:</strong> ${props.location}</p>` : ''}
    </div>
  `;
}
```

### Advanced Customization

#### Custom Base Map

Replace MapTiler with custom tiles:

```typescript
this.map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'osm',
      type: 'raster',
      source: 'osm'
    }]
  },
  center: MAP_CONFIG.center,
  zoom: MAP_CONFIG.zoom,
});
```

#### Add 3D Buildings

```typescript
this.map.on('load', () => {
  this.map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'paint': {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.6
    }
  });
});
```

#### Add Search Functionality

```typescript
// Install geocoding plugin
npm install @maplibre/maplibre-gl-geocoder

// Add to main.ts
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

this.map.addControl(
  new MaplibreGeocoder({
    forwardGeocode: async (config) => {
      // Your geocoding logic
    }
  }),
  'top-left'
);
```

#### Add Print Functionality

```typescript
// Add print button
const printBtn = document.createElement('button');
printBtn.textContent = 'Print Map';
printBtn.onclick = () => {
  window.print();
};

// Add print styles in CSS
@media print {
  .sidebar,
  .layer-control {
    display: none;
  }
  
  #map {
    width: 100%;
    height: 100vh;
  }
}
```

---

## API Reference

### Main Classes

#### ApelosMap Class

Main application class that handles map initialization and interactions.

**Constructor:**
```typescript
new ApelosMap()
```

**Private Methods:**

##### `initMap(): Promise<void>`
Initializes the map with controls and event listeners.

##### `loadAllLayers(): Promise<void>`
Loads all configured GeoJSON layers.

##### `addApelosLayers(layer: LayerConfig): void`
Adds the Apelos point layer with clustering.

**Parameters:**
- `layer` - Layer configuration object

##### `addPointLayer(layer: LayerConfig): void`
Adds a simple point layer.

##### `addPolygonLayer(layer: LayerConfig): void`
Adds a polygon layer with fill and outline.

##### `addLineLayer(layer: LayerConfig): void`
Adds a line layer.

##### `createLayerControl(): void`
Creates the layer control panel UI.

##### `toggleLayer(layerId: string, visible: boolean): void`
Toggles layer visibility.

**Parameters:**
- `layerId` - Unique layer identifier
- `visible` - true to show, false to hide

##### `getLayerIds(baseId: string): string[]`
Gets all MapLibre layer IDs for a data layer.

**Returns:** Array of layer ID strings

##### `setupInteractions(): void`
Sets up map click and hover interactions.

##### `createPopupContent(props: Record<string, unknown>): string`
Creates HTML content for popups.

**Parameters:**
- `props` - Feature properties object

**Returns:** HTML string

##### `updateSidebar(props: Record<string, unknown>): void`
Updates sidebar with feature information.

### Configuration Interfaces

#### LayerConfig
```typescript
interface LayerConfig {
  id: string;           // Unique identifier
  name: string;         // Display name
  file: string;         // GeoJSON filename
  type: 'point' | 'polygon' | 'line';
  visible: boolean;     // Initial visibility
  color: string;        // Hex color
  category: 'main' | 'context';
}
```

#### MapConfig
```typescript
interface MapConfig {
  center: [number, number];  // [longitude, latitude]
  zoom: number;              // 0-22
  pitch: number;             // 0-60
  bearing: number;           // 0-360
}
```

### Global Constants

#### `MAPTILER_KEY: string`
MapTiler API key from environment variables.

#### `MAP_CONFIG: MapConfig`
Initial map configuration.

#### `LAYERS: LayerConfig[]`
Array of layer configurations.

### Environment Variables

Accessed via `import.meta.env`:

- `VITE_MAPTILER_KEY` - MapTiler API key (required)
- `VITE_APP_TITLE` - Application title (optional)
- `VITE_APP_DESCRIPTION` - Application description (optional)
- `BASE_URL` - Base URL for assets (auto-set by Vite)

### Event Handlers

#### Map Events

```typescript
// Map loaded
this.map.on('load', callback);

// Click events
this.map.on('click', layerId, callback);

// Mouse events
this.map.on('mouseenter', layerId, callback);
this.map.on('mouseleave', layerId, callback);
```

#### Layer Control Events

```typescript
// Checkbox change
checkbox.addEventListener('change', callback);

// Panel toggle
toggleBtn.addEventListener('click', callback);
```

---

## Troubleshooting

### Common Issues

#### 1. Map Doesn't Load

**Symptom:** Blank map or loading spinner

**Solutions:**

A. **Check API Key**
```bash
# Verify .env file exists
cat web/.env

# Should show:
VITE_MAPTILER_KEY=your_actual_key

# Check in browser console
# Should NOT see 401 Unauthorized errors
```

B. **Check Network**
- Open DevTools (F12) → Network tab
- Look for failed requests to api.maptiler.com
- Check for CORS errors

C. **Verify Build**
```bash
npm run build
# Should complete without errors
```

#### 2. Data Not Loading

**Symptom:** Map loads but no points/polygons appear

**Solutions:**

A. **Check Data Files**
```bash
ls -la web/public/data/
# Should show .geojson files
```

B. **Verify File Paths**
```typescript
// In main.ts, check:
const response = await fetch(`${basePath}data/apelos_clean.geojson`);
```

C. **Check Browser Console**
- Look for 404 errors
- Check GeoJSON format is valid

D. **Validate GeoJSON**
Visit http://geojson.io and paste your GeoJSON

#### 3. Build Errors

**Symptom:** `npm run build` fails

**Solutions:**

A. **TypeScript Errors**
```bash
npm run type-check
# Fix reported errors
```

B. **Dependency Issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

C. **Missing terser**
```bash
npm install -D terser
```

#### 4. Layer Control Not Working

**Symptom:** Checkboxes don't toggle layers

**Solutions:**

A. **Check Layer IDs**
- Verify layer IDs in `LAYERS` array match
- Check browser console for errors

B. **Verify Layer Initialization**
```typescript
// All layers should be added to map
console.log(this.map.getStyle().layers);
```

#### 5. Deployment Failures

**GitHub Actions:**

A. **Check Workflow Logs**
- Go to Actions tab
- Click failed workflow
- Review error messages

B. **Verify Secrets**
- Settings → Secrets → Actions
- Ensure `VITE_MAPTILER_KEY` exists

C. **Check Permissions**
- Settings → Actions → General
- Workflow permissions: Read and write

**Vercel:**

A. **Check Build Logs**
- Vercel Dashboard → Deployments
- Click failed deployment
- Review logs

B. **Environment Variables**
- Project Settings → Environment Variables
- Verify `VITE_MAPTILER_KEY` is set

#### 6. Performance Issues

**Symptom:** Map is slow or laggy

**Solutions:**

A. **Reduce Data Size**
```bash
# Simplify geometry
npm install -g mapshaper
mapshaper input.geojson -simplify 10% -o output.geojson
```

B. **Optimize Clustering**
```typescript
clusterRadius: 30,  // Reduce from 50
clusterMaxZoom: 14,  // Reduce from 16
```

C. **Enable Caching**
- Ensure gzip compression is enabled
- Use CDN for static assets

### Debug Mode

Enable detailed logging:

```typescript
// Add to main.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Map config:', MAP_CONFIG);
  console.log('Layers:', LAYERS);
  console.log('Map loaded:', this.map.loaded());
}
```

### Browser Compatibility

**Supported:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Chrome/Safari

**Not Supported:**
- Internet Explorer (any version)
- Old Android browsers (<4.4)

### Getting Help

1. **Check Documentation**
   - Read this file thoroughly
   - Check FAQ section below

2. **Search Issues**
   - GitHub Issues tab
   - Look for similar problems

3. **Create Issue**
   - Provide error messages
   - Include browser console output
   - Share relevant code snippets
   - Describe steps to reproduce

4. **Contact Authors**
   - Francesca: arq.francesca.martinelli@gmail.com
   - Cristofer: cristofercosta@yahoo.com.br

---

## Contributing

### How to Contribute

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
   ```bash
   npm run type-check
   npm run build
   npm run preview
   ```
5. **Commit with clear message**
   ```bash
   git commit -m "Add: feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create Pull Request**

### Contribution Guidelines

**Code Style:**
- Use TypeScript for type safety
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small

**Commit Messages:**
```
Add: new feature
Fix: bug description
Update: modification description
Remove: removed feature
Docs: documentation changes
```

**Testing:**
- Test on multiple browsers
- Verify mobile responsiveness
- Check performance
- Validate data formats

**Documentation:**
- Update relevant docs
- Add JSDoc comments
- Update README if needed
- Include examples

### Areas for Contribution

**Features:**
- Additional data layers
- Search functionality
- Export capabilities
- Print support
- Analytics integration

**Improvements:**
- Performance optimization
- Accessibility enhancements
- Mobile UX
- Error handling
- Loading states

**Documentation:**
- Tutorial videos
- Code examples
- Translation to Portuguese
- User guides

**Data:**
- Additional historical data
- Data validation
- Format conversion scripts

---

## FAQ

### General Questions

**Q: Is this project open source?**
A: Yes, licensed under MIT License.

**Q: Can I use this for my own project?**
A: Absolutely! Fork it and customize as needed.

**Q: Do I need a MapTiler account?**
A: Yes, but the free tier (100k tiles/month) is sufficient for most projects.

**Q: Can I use different map tiles?**
A: Yes, you can use any MapLibre-compatible tile source (OpenStreetMap, Mapbox, etc.)

### Technical Questions

**Q: Why TypeScript?**
A: Type safety prevents bugs and improves developer experience.

**Q: Can I add more than 2 layers?**
A: Yes! Add as many as needed to the `LAYERS` array.

**Q: How do I change the language?**
A: Edit text strings in `index.html` and `main.ts`.

**Q: Can I use this without Node.js?**
A: For development, Node.js is required. For deployment, the built files are static HTML/JS/CSS.

**Q: How much does hosting cost?**
A: Free on Vercel, Netlify, or GitHub Pages. VPS hosting starts at $5/month.

### Data Questions

**Q: What GeoJSON formats are supported?**
A: Standard GeoJSON with Point, LineString, or Polygon geometries.

**Q: How large can my data files be?**
A: Recommend <5MB per file. Larger files should be simplified or split.

**Q: Can I use Shapefiles?**
A: Convert to GeoJSON first using QGIS or ogr2ogr.

**Q: How do I update the data?**
A: Replace files in `web/public/data/` and rebuild.

### Deployment Questions

**Q: Which platform is best?**
A: Vercel for ease of use, GitHub Pages for learning, VPS for full control.

**Q: Can I use my own domain?**
A: Yes, all platforms support custom domains (free on Vercel/Netlify/GitHub Pages).

**Q: How long does deployment take?**
A: Vercel: ~60s, Netlify: ~90s, GitHub Pages: ~2-3min

**Q: Are automatic deployments safe?**
A: Yes, changes only deploy after successful build and tests.

### Performance Questions

**Q: How can I make it faster?**
A: Simplify geometries, reduce data size, enable caching, use CDN.

**Q: What's the max number of points?**
A: With clustering, thousands of points perform well. Test with your specific data.

**Q: Does it work offline?**
A: No, requires internet for map tiles. Could be modified with service workers.

---

## Appendix

### Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run type-check      # Check TypeScript types

# Deployment
vercel                  # Deploy to Vercel
vercel --prod          # Deploy to production
netlify deploy --prod  # Deploy to Netlify
git push origin main   # Trigger GitHub Actions

# Docker
docker build -t apelos-map .
docker run -p 8080:80 apelos-map
docker-compose up -d
docker-compose down

# Data Processing
jupyter notebook process.ipynb
```

### Resources

**Documentation:**
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [GeoJSON Specification](https://geojson.org/)

**Tools:**
- [GeoJSON.io](http://geojson.io/) - Validate and edit GeoJSON
- [Mapshaper](https://mapshaper.org/) - Simplify geometries
- [QGIS](https://qgis.org/) - Desktop GIS software

**Tutorials:**
- [MapLibre Examples](https://maplibre.org/maplibre-gl-js-docs/example/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

### Version History

**v1.0.0** - Current
- Initial release
- 2 interactive layers
- Professional layer control
- Multiple deployment options
- Complete documentation

### License

MIT License - See LICENSE file for details.

### Authors

**Francesca Dalmagro Martinelli**
- Research and GIS Analysis
- Email: arq.francesca.martinelli@gmail.com

**Cristofer Antoni Souza Costa**
- Development and Data Processing
- Email: cristofercosta@yahoo.com.br

### Acknowledgments

- DATA.RIO for municipal geospatial data
- Historical archives for appeal documents
- OpenStreetMap contributors
- MapTiler for map tiles
- MapLibre GL JS community

---

**Last Updated:** October 2025

**Need help?** Open an issue on GitHub or contact the authors directly.


