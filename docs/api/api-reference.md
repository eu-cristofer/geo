# 📋 API Reference

Complete technical reference for the Estado Novo Mapping Project API and configuration.

## 📋 Table of Contents

1. [Configuration Interfaces](#configuration-interfaces)
2. [Main Classes](#main-classes)
3. [Environment Variables](#environment-variables)
4. [Layer System](#layer-system)
5. [Map Configuration](#map-configuration)
6. [Event Handlers](#event-handlers)
7. [Utility Functions](#utility-functions)
8. [Data Formats](#data-formats)

---

## Configuration Interfaces

### LayerConfig

Defines the configuration for a map layer.

```typescript
interface LayerConfig {
  id: string;           // Unique identifier for the layer
  name: string;         // Display name in layer control
  file: string;         // GeoJSON filename in public/data/
  type: 'point' | 'polygon' | 'line';  // Geometry type
  visible: boolean;     // Initial visibility state
  color: string;        // Hex color code (#RRGGBB)
  category: 'main' | 'context';  // Layer category
}
```

**Example:**
```typescript
{
  id: 'apelos',
  name: 'Apelos (Appeals)',
  file: 'apelos_clean.geojson',
  type: 'point',
  visible: true,
  color: '#C1272D',
  category: 'main'
}
```

### MapConfig

Defines the initial map configuration.

```typescript
interface MapConfig {
  center: [number, number];  // [longitude, latitude]
  zoom: number;              // Initial zoom level (0-22)
  pitch: number;             // 3D tilt angle (0-60)
  bearing: number;           // Rotation angle (0-360)
}
```

**Example:**
```typescript
{
  center: [-43.1895, -22.9068],
  zoom: 13,
  pitch: 0,
  bearing: 0
}
```

### FeatureProperties

Properties available in GeoJSON features.

```typescript
interface FeatureProperties {
  Name?: string;        // Location name/address
  Description?: string; // Full description
  Link?: string;        // URL to original document
  [key: string]: any;   // Additional custom properties
}
```

---

## Main Classes

### ApelosMap

Main application class that handles map initialization and interactions.

#### Constructor

```typescript
new ApelosMap()
```

Creates a new instance of the mapping application.

#### Private Methods

##### `initMap(): Promise<void>`

Initializes the map with controls and event listeners.

**Returns:** Promise that resolves when map is ready

**Usage:**
```typescript
await this.initMap();
```

##### `loadAllLayers(): Promise<void>`

Loads all configured GeoJSON layers from the LAYERS array.

**Returns:** Promise that resolves when all layers are loaded

##### `addApelosLayers(layer: LayerConfig): void`

Adds the Apelos point layer with clustering support.

**Parameters:**
- `layer` - Layer configuration object

**Features:**
- Point clustering at low zoom levels
- Graduated cluster sizes and colors
- Click to expand clusters
- Click points for detailed popups

##### `addPointLayer(layer: LayerConfig): void`

Adds a simple point layer without clustering.

**Parameters:**
- `layer` - Layer configuration object

##### `addPolygonLayer(layer: LayerConfig): void`

Adds a polygon layer with fill and outline sub-layers.

**Parameters:**
- `layer` - Layer configuration object

**Features:**
- Fill layer with configurable opacity
- Outline layer with configurable width and color
- Hover effects

##### `addLineLayer(layer: LayerConfig): void`

Adds a line layer for linear features.

**Parameters:**
- `layer` - Layer configuration object

##### `createLayerControl(): void`

Creates the layer control panel UI.

**Features:**
- Collapsible panel
- Checkbox toggles for each layer
- Color indicators
- Responsive design

##### `toggleLayer(layerId: string, visible: boolean): void`

Toggles layer visibility.

**Parameters:**
- `layerId` - Unique layer identifier
- `visible` - true to show, false to hide

##### `getLayerIds(baseId: string): string[]`

Gets all MapLibre layer IDs for a data layer.

**Parameters:**
- `baseId` - Base layer identifier

**Returns:** Array of layer ID strings

**Example:**
```typescript
const layerIds = this.getLayerIds('apelos');
// Returns: ['apelos-clusters', 'apelos-cluster-count', 'apelos-unclustered-point']
```

##### `setupInteractions(): void`

Sets up map click and hover interactions.

**Features:**
- Click handlers for all layers
- Hover effects
- Popup creation
- Sidebar updates

##### `createPopupContent(props: Record<string, unknown>): string`

Creates HTML content for popups.

**Parameters:**
- `props` - Feature properties object

**Returns:** HTML string for popup content

**Example:**
```typescript
const popupHTML = this.createPopupContent({
  Name: 'R. Sen. Furtado, 61',
  Description: 'Lavanderia Confiança...',
  Link: 'https://drive.google.com/...'
});
```

##### `updateSidebar(props: Record<string, unknown>): void`

Updates sidebar with feature information.

**Parameters:**
- `props` - Feature properties object

---

## Environment Variables

### VITE_MAPTILER_KEY

**Type:** `string`  
**Required:** Yes  
**Description:** MapTiler API key for map tiles

**Usage:**
```typescript
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
```

**Get Key:**
1. Visit https://www.maptiler.com/cloud/
2. Sign up for free account
3. Go to Account → Keys
4. Copy your API key

### VITE_APP_TITLE

**Type:** `string`  
**Required:** No  
**Default:** "Estado Novo - Mapeamento dos Apelos"  
**Description:** Application title

### VITE_APP_DESCRIPTION

**Type:** `string`  
**Required:** No  
**Default:** "Mapa interativo dos apelos de desapropriação"  
**Description:** Application description

### BASE_URL

**Type:** `string`  
**Required:** No  
**Description:** Base URL for assets (auto-set by Vite)

---

## Layer System

### Layer Types

#### Point Layers

**Configuration:**
```typescript
{
  type: 'point',
  // ... other config
}
```

**Features:**
- Rendered as circles
- Support clustering
- Hover effects
- Click handlers for popups

**Styling Options:**
```typescript
'circle-color': layer.color,
'circle-radius': 6,
'circle-stroke-width': 2,
'circle-stroke-color': '#fff',
'circle-opacity': 0.8,
'circle-stroke-opacity': 1.0,
```

#### Polygon Layers

**Configuration:**
```typescript
{
  type: 'polygon',
  // ... other config
}
```

**Features:**
- Two sub-layers: fill and outline
- Configurable opacity
- Border width and color
- Fill pattern support

**Styling Options:**
```typescript
// Fill
'fill-color': layer.color,
'fill-opacity': 0.2,

// Outline
'line-color': layer.color,
'line-width': 2,
'line-opacity': 0.8,
```

#### Line Layers

**Configuration:**
```typescript
{
  type: 'line',
  // ... other config
}
```

**Features:**
- Single line layer
- Width and opacity control
- Dash patterns supported

**Styling Options:**
```typescript
'line-color': layer.color,
'line-width': 1,
'line-opacity': 0.6,
```

### Clustering Configuration

**For Point Layers:**

```typescript
this.map.addSource('layer-id', {
  type: 'geojson',
  data: data,
  cluster: true,
  clusterMaxZoom: 16,     // Max zoom to cluster points
  clusterRadius: 50,      // Cluster radius in pixels
});
```

**Cluster Styling:**

```typescript
// Cluster colors based on count
'circle-color': [
  'case',
  ['<', ['get', 'point_count'], 10], '#E8B931',  // Yellow
  ['<', ['get', 'point_count'], 30], '#E8862E',  // Orange
  '#C1272D'  // Red for large clusters
],

// Cluster sizes
'circle-radius': [
  'case',
  ['<', ['get', 'point_count'], 10], 12,  // Small
  ['<', ['get', 'point_count'], 30], 18,  // Medium
  24  // Large
],
```

---

## Map Configuration

### Initial Map Setup

```typescript
this.map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  center: MAP_CONFIG.center,
  zoom: MAP_CONFIG.zoom,
  pitch: MAP_CONFIG.pitch,
  bearing: MAP_CONFIG.bearing,
});
```

### Available Map Styles

**MapTiler Styles:**
```typescript
const styles = [
  'streets-v2',    // Default street map
  'outdoor-v2',    // Outdoor/topographic
  'satellite',     // Satellite imagery
  'basic-v2',      // Basic street map
  'bright-v2',     // Bright theme
  'dark-v2',       // Dark theme
];
```

**Usage:**
```typescript
const styleUrl = `https://api.maptiler.com/maps/${styleName}/style.json?key=${MAPTILER_KEY}`;
```

### Map Controls

**Navigation Controls:**
```typescript
this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
```

**Scale Control:**
```typescript
this.map.addControl(new maplibregl.ScaleControl({
  maxWidth: 100,
  unit: 'metric'
}), 'bottom-right');
```

**Fullscreen Control:**
```typescript
this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
```

---

## Event Handlers

### Map Events

#### Map Loaded

```typescript
this.map.on('load', () => {
  // Map is ready for layers and interactions
  this.loadAllLayers();
});
```

#### Click Events

```typescript
// Click on specific layer
this.map.on('click', 'layer-id', (e) => {
  const features = e.features;
  if (features && features.length > 0) {
    const props = features[0].properties;
    this.showPopup(e.lngLat, props);
  }
});
```

#### Hover Events

```typescript
// Mouse enter
this.map.on('mouseenter', 'layer-id', () => {
  this.map.getCanvas().style.cursor = 'pointer';
});

// Mouse leave
this.map.on('mouseleave', 'layer-id', () => {
  this.map.getCanvas().style.cursor = '';
});
```

### Layer Control Events

#### Checkbox Change

```typescript
checkbox.addEventListener('change', (e) => {
  const visible = e.target.checked;
  this.toggleLayer(layerId, visible);
});
```

#### Panel Toggle

```typescript
toggleBtn.addEventListener('click', () => {
  const isExpanded = panel.classList.contains('expanded');
  panel.classList.toggle('expanded');
  toggleBtn.setAttribute('aria-expanded', (!isExpanded).toString());
});
```

---

## Utility Functions

### Data Loading

```typescript
async function loadGeoJSONData(url: string): Promise<GeoJSON.FeatureCollection> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load GeoJSON data:', error);
    throw error;
  }
}
```

### Coordinate Validation

```typescript
function isValidCoordinate(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' && 
    typeof lat === 'number' &&
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90
  );
}
```

### Color Utilities

```typescript
function hexToRgb(hex: string): {r: number, g: number, b: number} | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
```

---

## Data Formats

### GeoJSON Structure

**Feature Collection:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Name": "R. Sen. Furtado, 61",
        "Description": "Lavanderia Confiança - desapropriação...",
        "Link": "https://drive.google.com/file/d/..."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-43.2187139, -22.9119948, 0.0]
      }
    }
  ]
}
```

### Point Geometry

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude, elevation]
}
```

### Polygon Geometry

```json
{
  "type": "Polygon",
  "coordinates": [[
    [lng1, lat1],
    [lng2, lat2],
    [lng3, lat3],
    [lng1, lat1]
  ]]
}
```

### LineString Geometry

```json
{
  "type": "LineString",
  "coordinates": [
    [lng1, lat1],
    [lng2, lat2],
    [lng3, lat3]
  ]
}
```

### Property Requirements

**Required Properties:**
- `Name` - Location identifier (string)
- `Description` - Full description (string)

**Optional Properties:**
- `Link` - URL to document (string)
- Custom properties for specific use cases

---

## Performance Considerations

### Data Optimization

**File Size Limits:**
- Recommended: < 5MB per GeoJSON file
- Maximum: < 10MB per file
- Use compression for larger files

**Geometry Simplification:**
```bash
# Use mapshaper for simplification
mapshaper input.geojson -simplify 10% -o output.geojson
```

### Rendering Optimization

**Clustering Parameters:**
```typescript
// Optimize for performance
clusterRadius: 50,      // Balance between clustering and detail
clusterMaxZoom: 16,     // Stop clustering at zoom 16
```

**Layer Visibility:**
```typescript
// Hide layers by default to improve initial load
visible: false
```

---

## Error Handling

### Common Error Types

**Network Errors:**
```typescript
try {
  const data = await fetch(url);
  if (!data.ok) {
    throw new Error(`HTTP ${data.status}: ${data.statusText}`);
  }
} catch (error) {
  console.error('Network error:', error);
  // Provide fallback or user feedback
}
```

**Data Validation:**
```typescript
function validateGeoJSON(data: any): boolean {
  return (
    data &&
    data.type === 'FeatureCollection' &&
    Array.isArray(data.features)
  );
}
```

**API Key Validation:**
```typescript
function validateAPIKey(key: string): boolean {
  return key && key.length > 10 && !key.includes('your_key');
}
```

---

## Browser Compatibility

### Supported Browsers

**Desktop:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS Safari 14+
- Android Chrome 90+
- Mobile Firefox 88+

### Feature Detection

```typescript
// Check for required features
const hasRequiredFeatures = (
  'fetch' in window &&
  'Promise' in window &&
  'Map' in window
);

if (!hasRequiredFeatures) {
  console.error('Browser does not support required features');
}
```

---

## Security Considerations

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.maptiler.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https://*.maptiler.com; 
               connect-src 'self' https://api.maptiler.com;">
```

### API Key Security

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Monitor usage for anomalies

---

## Testing

### Unit Testing

```typescript
// Example test structure
describe('ApelosMap', () => {
  test('should initialize map', async () => {
    const map = new ApelosMap();
    await map.initMap();
    expect(map.map).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// Test layer loading
test('should load all layers', async () => {
  const map = new ApelosMap();
  await map.initMap();
  await map.loadAllLayers();
  
  const layers = map.map.getStyle().layers;
  expect(layers.length).toBeGreaterThan(0);
});
```

---

## Getting Help

**API Questions:**
- Check this reference documentation
- Review the [Complete Documentation](../developer-guides/complete-documentation.md)
- Open a GitHub issue for bugs

**Contact:**
- **Francesca:** arq.francesca.martinelli@gmail.com
- **Cristofer:** cristofercosta@yahoo.com.br

---

**Happy coding! 🚀**

*Last Updated: October 2025*
