# 🎨 Customization Guide

Complete guide to customizing the Estado Novo Mapping Project - colors, layers, features, and more.

## 📋 Table of Contents

1. [Visual Customization](#visual-customization)
2. [Layer System](#layer-system)
3. [Map Configuration](#map-configuration)
4. [Popup Customization](#popup-customization)
5. [Advanced Features](#advanced-features)
6. [Performance Optimization](#performance-optimization)

---

## Visual Customization

### Color Scheme

**Primary Colors (Edit `src/style.css`):**

```css
:root {
  --primary-color: #C1272D;      /* Main brand color */
  --secondary-color: #E8862E;    /* Secondary accent */
  --accent-color: #E8B931;       /* Tertiary accent */
  --text-dark: #2c3e50;          /* Dark text */
  --text-light: #666;            /* Light text */
  --bg-light: #f8f9fa;           /* Light backgrounds */
  --border-color: #e1e8ed;       /* Borders */
  --shadow-color: rgba(0,0,0,0.1); /* Shadows */
}
```

**Custom Color Palette Example:**
```css
:root {
  /* Blue theme */
  --primary-color: #3498DB;
  --secondary-color: #2ECC71;
  --accent-color: #F39C12;
  
  /* Or green theme */
  --primary-color: #27AE60;
  --secondary-color: #2ECC71;
  --accent-color: #F1C40F;
}
```

### Typography

**Font Family:**
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

**Font Sizes:**
```css
:root {
  --font-size-small: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
}
```

### Layout Adjustments

**Sidebar Width:**
```css
.sidebar {
  width: 380px;  /* Change this value */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
  }
}
```

**Layer Control Position:**
```css
.layer-control {
  top: 1rem;    /* Distance from top */
  right: 1rem;  /* Distance from right */
  
  /* Move to left side */
  /* left: 1rem;
     right: auto; */
}
```

**Header Styling:**
```css
.layer-control-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1rem;
  border-radius: 8px 8px 0 0;
}
```

---

## Layer System

### Layer Configuration

**Basic Layer Structure (`src/main.ts`):**

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

### Registered data layers

Defined in the `LAYERS` array in `web/src/main.ts`; each renders a checkbox +
style controls in the "Camadas do Mapa" panel.

| `id` | Name (UI) | File (`web/public/data/`) | Type | Default |
|------|-----------|---------------------------|------|---------|
| `apelos` | Apelos (Appeals) | `apelos_clean_tese.geojson` | point (clustered) | visible |
| `filtro-bairros` | Bairros Filtrados | `filtro_bairros_tese.geojson` | polygon | hidden |
| `limite-municipio` | Limite do Município (City Limits) | `limite_municipio_tese.geojson` | polygon | hidden |

> **City Limits provenance:** `limite_municipio_tese.geojson` is the municipal
> boundary of Rio de Janeiro, derived by dissolving the 166 neighborhood polygons
> in `DATA.RIO/Limite_de_Bairros.geojson` with `geo.dissolve_boundary(...,
> simplify_m=15, min_area_m2=50_000)` (drops negligible islets, ~2k vertices,
> ~225 KB). It uses a distinct red outline (`CITY_LIMIT_COLOR`) and a faint fill so
> the whole-city polygon reads as a limit rather than tinting the map. Since
> `DATA.RIO/` is gitignored, the dissolved artifact is committed to
> `processed_data/` so deploys don't depend on the raw source.

### Add New Layer

**Step 1: Add GeoJSON Data**
```bash
# Copy your GeoJSON file
cp your-data.geojson web/public/data/
```

**Step 2: Update LAYERS Array**
```typescript
const LAYERS: LayerConfig[] = [
  // ... existing layers
  {
    id: 'my-new-layer',
    name: 'My New Layer',
    file: 'your-data.geojson',
    type: 'point',        // or 'polygon' or 'line'
    visible: false,       // Start hidden
    color: '#FF6B6B',     // Your chosen color
    category: 'main',
  },
];
```

**Step 3: Test the Layer**
```bash
npm run dev
# Check that layer appears in control panel
# Toggle visibility to test
```

### Layer Types and Styling

**Point Layers:**
```typescript
// In addPointLayer method
'circle-color': layer.color,
'circle-radius': 6,                    // Point size
'circle-stroke-width': 2,              // Border width
'circle-stroke-color': '#fff',         // Border color
'circle-opacity': 0.8,                 // Transparency
'circle-stroke-opacity': 1.0,
```

**Polygon Layers:**
```typescript
// Fill layer
'fill-color': layer.color,
'fill-opacity': 0.2,                   // Fill transparency

// Outline layer  
'line-color': layer.color,
'line-width': 2,                       // Border width
'line-opacity': 0.8,                   // Border transparency
```

**Line Layers:**
```typescript
'line-color': layer.color,
'line-width': 1,                       // Line thickness
'line-opacity': 0.6,                   // Transparency
```

### Clustering Configuration

**Modify Clustering (for point layers):**
```typescript
this.map.addSource('apelos', {
  type: 'geojson',
  data: data,
  cluster: true,
  clusterMaxZoom: 16,     // Max zoom to cluster points
  clusterRadius: 50,      // Cluster radius in pixels
});
```

**Cluster Colors:**
```typescript
// Small clusters
'circle-color': [
  'case',
  ['<', ['get', 'point_count'], 10], '#E8B931',  // Yellow
  ['<', ['get', 'point_count'], 30], '#E8862E',  // Orange  
  '#C1272D'  // Red for large clusters
],
```

---

## Map Configuration

### Initial View Settings

**Map Center and Zoom:**
```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068],  // [longitude, latitude]
  zoom: 13,                       // Initial zoom (0-22)
  pitch: 0,                       // 3D tilt (0-60)
  bearing: 0,                     // Rotation (0-360)
};
```

**Custom View Examples:**
```typescript
// Focus on specific area
center: [-43.2000, -22.9000],  // Different coordinates
zoom: 15,                       // More zoomed in

// 3D view
pitch: 45,                      // Tilted view
bearing: 180,                   // Rotated view
```

### Base Maps (Basemap Registry)

All selectable base maps are registered in the `BASEMAPS` array in `web/src/main.ts`.
The base-map switcher (the "Mapa base" grid in the layer panel) renders one button
per entry automatically, so adding a basemap is a single edit to that array.

A basemap is one of two shapes (`type Basemap = VectorBasemap | RasterBasemap`):

- **Vector** — a MapTiler style referenced by its slug (`mapId`). Requires
  `VITE_MAPTILER_KEY`.
- **Raster** — an XYZ tile source from any provider (`kind: 'raster'`). Mostly
  key-less. Each must declare `attribution`; `tileSize` defaults to 256 (MapLibre's
  own default is 512, which would misalign standard XYZ tiles).

#### Registered base maps

**Vector — MapTiler (require `VITE_MAPTILER_KEY`):**

| `id` | Label (UI) | MapTiler slug | Notes |
|------|------------|---------------|-------|
| `streets` | Ruas | `streets-v2` | Default |
| `light` | Claro | `dataviz` | Clean, data-overlay friendly |
| `dark` | Escuro | `dataviz-dark` | Dark counterpart |
| `satellite` | Satélite | `hybrid` | Imagery + labels |
| `satellite-pure` | Satélite limpo | `satellite` | Imagery, no labels — good under the 1928 overlay |
| `topo` | Topo | `topo-v2` | Topographic |
| `outdoor` | Relevo | `outdoor-v2` | Terrain shading, contours, trails |
| `osm` | OpenStreetMap | `openstreetmap` | OSM vector style |
| `basic` | Básico | `basic-v2` | Minimal neutral background |
| `toner` | P&B | `toner-v2` | High-contrast, print |

**Raster — other providers (key-less unless noted):**

| `id` | Label (UI) | Provider | Max zoom | Key |
|------|------------|----------|----------|-----|
| `esri-imagery` | Satélite Esri | Esri World Imagery | 19 | none |
| `carto-light` | CARTO Claro | CARTO Positron (retina `@2x`) | 20 | none |
| `carto-dark` | CARTO Escuro | CARTO Dark Matter (retina `@2x`) | 20 | none |
| `opentopo` | OpenTopoMap | OpenTopoMap | 17 | none |
| `watercolor` | Aquarela | Stamen Watercolor (via Stadia Maps) | 16 | optional `VITE_STADIA_KEY` |

> **Aquarela / Stadia note:** Stadia Maps tiles work key-less from `localhost` and
> authorized domains. For the deployed GitHub Pages site, register a free key at
> [stadiamaps.com](https://stadiamaps.com), authorize the domain, and set
> `VITE_STADIA_KEY`. Without it, Aquarela renders in local dev but is blank in
> production; every other basemap is unaffected.

#### Changing the default

```typescript
// web/src/main.ts
const DEFAULT_BASEMAP = 'streets'; // any registered basemap `id`
```

#### Adding a base map

```typescript
// web/src/main.ts — append to the BASEMAPS array

// A MapTiler vector style:
{ id: 'winter', label: 'Inverno', mapId: 'winter-v2' },

// A raster XYZ source from another provider:
{
  kind: 'raster',
  id: 'my-tiles',
  label: 'Meu Mapa',
  tiles: ['https://tiles.example.com/{z}/{x}/{y}.png'],
  attribution: '© Example',
  maxzoom: 19,   // optional, defaults to 19
  tileSize: 256, // optional, defaults to 256
}
```

The button, click handler, and base-map swap (which carries the data layers and
1928 overlay across via `transformStyle`) all work automatically. Raster styles are
built by `rasterBasemapStyle()`, which injects a `glyphs` URL so the apelos
cluster-count labels keep rendering after a swap.

---

## Popup Customization

### Popup Content

**Basic Popup Structure:**
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
    </div>
  `;
}
```

**Enhanced Popup with Custom Fields:**
```typescript
private createPopupContent(props: Record<string, unknown>): string {
  const name = props.Name || 'Sem informação';
  const description = props.Description || 'Descrição não disponível';
  const link = props.Link;
  const date = props.Date;
  const location = props.Location;
  const status = props.Status;

  return `
    <div class="popup-content">
      <h3>${name}</h3>
      <p>${description}</p>
      
      ${date ? `<p><strong>Data:</strong> ${date}</p>` : ''}
      ${location ? `<p><strong>Local:</strong> ${location}</p>` : ''}
      ${status ? `<p><strong>Status:</strong> <span class="status-${status.toLowerCase()}">${status}</span></p>` : ''}
      
      ${link ? `<a href="${link}" target="_blank" class="document-link">📄 Ver documento original</a>` : ''}
      
      <div class="popup-actions">
        <button onclick="navigator.clipboard.writeText('${name}')">📋 Copiar nome</button>
        <button onclick="window.open('https://maps.google.com/?q=${props.Latitude},${props.Longitude}', '_blank')">🗺️ Abrir no Google Maps</button>
      </div>
    </div>
  `;
}
```

### Popup Styling

**Custom Popup CSS:**
```css
.maplibregl-popup-content {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.popup-content {
  padding: 1rem;
  max-width: 300px;
}

.popup-content h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.popup-content p {
  margin: 0.5rem 0;
  line-height: 1.4;
}

.document-link {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
}

.popup-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.popup-actions button {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}
```

---

## Advanced Features

### Add Search Functionality

**Install Geocoding Plugin:**
```bash
npm install @maplibre/maplibre-gl-geocoder
```

**Add Search Control:**
```typescript
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

// Add to map initialization
this.map.addControl(
  new MaplibreGeocoder({
    forwardGeocode: async (config) => {
      const features = [];
      // Your geocoding logic here
      return { features };
    }
  }),
  'top-left'
);
```

### Add 3D Buildings

```typescript
// Add after map loads
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

### Add Print Functionality

**Print Button:**
```typescript
// Add print button to controls
const printBtn = document.createElement('button');
printBtn.textContent = '🖨️ Imprimir';
printBtn.className = 'map-control-button';
printBtn.onclick = () => {
  window.print();
};

// Add to map container
document.querySelector('.map-controls')?.appendChild(printBtn);
```

**Print Styles:**
```css
@media print {
  .sidebar,
  .layer-control,
  .map-controls {
    display: none;
  }
  
  #map {
    width: 100%;
    height: 100vh;
  }
  
  .maplibregl-popup {
    display: none;
  }
}
```

### Add Fullscreen Toggle

```typescript
// Add fullscreen button
const fullscreenBtn = document.createElement('button');
fullscreenBtn.textContent = '⛶';
fullscreenBtn.className = 'map-control-button';
fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
```

### Add Layer Statistics

```typescript
// Add statistics panel
private createStatisticsPanel(): void {
  const statsPanel = document.createElement('div');
  statsPanel.className = 'statistics-panel';
  
  // Calculate statistics for each layer
  this.updateStatistics(statsPanel);
  
  document.querySelector('.sidebar')?.appendChild(statsPanel);
}

private updateStatistics(panel: HTMLElement): void {
  const stats = this.calculateLayerStats();
  
  panel.innerHTML = `
    <h4>📊 Estatísticas</h4>
    ${Object.entries(stats).map(([layer, count]) => 
      `<p>${layer}: ${count} features</p>`
    ).join('')}
  `;
}
```

---

## Performance Optimization

### Data Optimization

**Simplify GeoJSON:**
```bash
# Install mapshaper
npm install -g mapshaper

# Simplify geometries
mapshaper input.geojson -simplify 10% -o output.geojson

# Reduce precision
mapshaper input.geojson -precision 0.0001 -o output.geojson
```

**Reduce File Size:**
```bash
# Compress GeoJSON
gzip -k data/*.geojson

# Or use brotli compression
brotli -k data/*.geojson
```

### Clustering Optimization

**Adjust Clustering Parameters:**
```typescript
// Reduce clustering for better performance
clusterRadius: 30,      // Smaller radius
clusterMaxZoom: 14,     // Cluster longer
```

**Dynamic Clustering:**
```typescript
// Adjust clustering based on zoom level
const getClusterRadius = (zoom: number) => {
  if (zoom < 10) return 80;
  if (zoom < 13) return 50;
  return 30;
};
```

### Lazy Loading

**Load Data on Demand:**
```typescript
// Load layers only when needed
private async loadLayerOnDemand(layerId: string): Promise<void> {
  if (this.loadedLayers.has(layerId)) return;
  
  const layer = LAYERS.find(l => l.id === layerId);
  if (!layer) return;
  
  const data = await this.fetchLayerData(layer.file);
  this.addLayerToMap(layer, data);
  this.loadedLayers.add(layerId);
}
```

### Image Optimization

**Optimize Images:**
```bash
# Install optimization tools
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
    }),
  ],
})
```

---

## Testing Customizations

### Visual Testing

```bash
# Test different screen sizes
npm run dev
# Use browser DevTools device emulation
# Test: Mobile, Tablet, Desktop
```

### Performance Testing

```bash
# Build and test performance
npm run build
npm run preview

# Use Lighthouse in Chrome DevTools
# Target: 90+ scores
```

### Cross-Browser Testing

**Test in multiple browsers:**
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

## Best Practices

### Code Organization

```typescript
// Keep customization code organized
class MapCustomizer {
  private config: CustomizationConfig;
  
  constructor(config: CustomizationConfig) {
    this.config = config;
  }
  
  applyCustomizations(): void {
    this.updateColors();
    this.updateLayers();
    this.updateMapConfig();
  }
}
```

### Configuration Management

```typescript
// Use configuration objects
interface CustomizationConfig {
  colors: ColorScheme;
  layers: LayerConfig[];
  map: MapConfig;
  features: FeatureFlags;
}

const defaultConfig: CustomizationConfig = {
  colors: {
    primary: '#C1272D',
    secondary: '#E8862E',
    accent: '#E8B931'
  },
  // ... other defaults
};
```

### Error Handling

```typescript
// Handle customization errors gracefully
try {
  this.applyCustomStyle(customStyle);
} catch (error) {
  console.warn('Custom style failed, using default:', error);
  this.applyDefaultStyle();
}
```

---

## Next Steps

After customizing your map:

1. **Test thoroughly** - Check all features work correctly
2. **Optimize performance** - Ensure good loading times
3. **Deploy** - Use the [Deployment Guide](../deployment/deployment-guide.md)
4. **Document changes** - Keep track of your customizations
5. **Share** - Consider contributing back to the project

---

## Getting Help

**Customization Issues:**
- Check this guide's examples
- Read the [Complete Documentation](complete-documentation.md)
- Test in browser DevTools

**Contact:**
- **Francesca:** arq.francesca.martinelli@gmail.com
- **Cristofer:** cristofercosta@yahoo.com.br

---

**Happy customizing! 🎨**

*Last Updated: October 2025*
