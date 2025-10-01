# API Reference

## ApelosMap Class API

### Constructor

```typescript
new ApelosMap()
```

Creates a new instance of the map application. Automatically initializes the map, loads layers, and sets up interactions.

**Side Effects**:
- Creates MapLibre map instance
- Initializes popup instance
- Checks for MapTiler API key
- Displays error if key is missing

**Example**:
```typescript
const app = new ApelosMap();
```

---

## Private Methods

### initMap()

```typescript
private async initMap(): Promise<void>
```

Initializes the map with controls and event handlers.

**Async**: Yes

**Process**:
1. Adds navigation controls
2. Adds scale control
3. Adds fullscreen control
4. Initializes layer states
5. Waits for map load event
6. Triggers layer loading

**Controls Added**:
- `NavigationControl` - Zoom and rotation buttons
- `ScaleControl` - Distance scale bar
- `FullscreenControl` - Fullscreen toggle button

---

### loadAllLayers()

```typescript
private async loadAllLayers(): Promise<void>
```

Loads all configured layers from GeoJSON files.

**Async**: Yes

**Process Flow**:
```
For each layer in LAYERS:
  1. Fetch GeoJSON from /data/{layer.file}
  2. Parse JSON response
  3. Determine layer type
  4. Add appropriate source
  5. Add appropriate layer(s)
  6. Log success or error
```

**Error Handling**:
- Catches fetch errors
- Logs errors to console
- Continues loading other layers

**Example Layer Loading**:
```typescript
const response = await fetch(`${basePath}data/${layer.file}`);
const data: FeatureCollection = await response.json();
this.map.addSource(layer.id, {
  type: 'geojson',
  data: data,
  // Additional options based on layer type
});
```

---

### addApelosLayers()

```typescript
private addApelosLayers(layer: LayerConfig): void
```

Creates clustered point visualization for appeals data.

**Parameters**:
- `layer: LayerConfig` - Layer configuration object

**Layers Created**:

#### 1. Clusters Layer (`{id}-clusters`)

```typescript
{
  type: 'circle',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#E8B931',  // 1-9 points: yellow
      10, '#E8862E',  // 10-29 points: orange
      30, layer.color  // 30+ points: red
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,  // 1-9 points
      10, 30,  // 10-29 points
      30, 40   // 30+ points
    ]
  }
}
```

#### 2. Cluster Count Layer (`{id}-cluster-count`)

```typescript
{
  type: 'symbol',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Noto Sans Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#ffffff'
  }
}
```

#### 3. Points Layer (`{id}-points`)

```typescript
{
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': layer.color,
    'circle-radius': 8,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
}
```

#### 4. Hover Effect Layer (`{id}-hover`)

```typescript
{
  type: 'circle',
  filter: ['all', 
    ['!', ['has', 'point_count']], 
    ['==', ['get', 'Name'], '']
  ],
  paint: {
    'circle-color': layer.color,
    'circle-radius': 14,
    'circle-opacity': 0.3
  }
}
```

---

### addPointLayer()

```typescript
private addPointLayer(layer: LayerConfig): void
```

Creates a simple point layer (non-clustered).

**Parameters**:
- `layer: LayerConfig` - Layer configuration object

**Layer Specification**:
```typescript
{
  id: `${layer.id}-points`,
  type: 'circle',
  source: layer.id,
  paint: {
    'circle-color': layer.color,
    'circle-radius': 6,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff',
    'circle-opacity': 0.8
  }
}
```

---

### addPolygonLayer()

```typescript
private addPolygonLayer(layer: LayerConfig): void
```

Creates fill and outline layers for polygon geometries.

**Parameters**:
- `layer: LayerConfig` - Layer configuration object

**Layers Created**:

#### Fill Layer
```typescript
{
  id: `${layer.id}-fill`,
  type: 'fill',
  paint: {
    'fill-color': layer.color,
    'fill-opacity': 0.2
  }
}
```

#### Outline Layer
```typescript
{
  id: `${layer.id}-outline`,
  type: 'line',
  paint: {
    'line-color': layer.color,
    'line-width': 2,
    'line-opacity': 0.8
  }
}
```

---

### addLineLayer()

```typescript
private addLineLayer(layer: LayerConfig): void
```

Creates a line layer for linear geometries.

**Parameters**:
- `layer: LayerConfig` - Layer configuration object

**Layer Specification**:
```typescript
{
  id: `${layer.id}-line`,
  type: 'line',
  paint: {
    'line-color': layer.color,
    'line-width': 1,
    'line-opacity': 0.6
  }
}
```

---

### createLayerControl()

```typescript
private createLayerControl(): void
```

Generates the layer visibility control panel.

**DOM Structure Created**:

```html
<div class="layer-control">
  <div class="layer-control-header">
    <h3>Camadas do Mapa</h3>
    <button class="layer-control-toggle">
      <svg>...</svg>
    </button>
  </div>
  <div class="layer-control-content">
    <div class="layer-group">
      <label class="layer-item">
        <input type="checkbox" data-layer-id="...">
        <span class="layer-color" style="background-color: ..."></span>
        <span class="layer-name">...</span>
      </label>
      <!-- Repeat for each layer -->
    </div>
  </div>
</div>
```

**Event Handlers**:
1. **Toggle Button Click**: Collapses/expands panel
2. **Checkbox Change**: Calls `toggleLayer()` method

**Accessibility**:
- `aria-label` on toggle button
- `aria-expanded` state management

---

### toggleLayer()

```typescript
private toggleLayer(layerId: string, visible: boolean): void
```

Shows or hides a map layer and all its sub-layers.

**Parameters**:
- `layerId: string` - Base layer identifier
- `visible: boolean` - Target visibility state

**Process**:
1. Update `layerStates` Map
2. Get all layer IDs for this data layer
3. Set layout visibility for each layer

**Example**:
```typescript
// Hide apelos layer
toggleLayer('apelos', false);
// Updates: apelos-clusters, apelos-cluster-count, 
//          apelos-points, apelos-hover
```

---

### getLayerIds()

```typescript
private getLayerIds(baseId: string): string[]
```

Returns all MapLibre layer IDs for a given data layer.

**Parameters**:
- `baseId: string` - Base layer identifier

**Returns**: Array of layer ID strings

**Logic**:

| Layer ID | Type | Returns |
|----------|------|---------|
| `apelos` | point | `['apelos-clusters', 'apelos-cluster-count', 'apelos-points', 'apelos-hover']` |
| Other point | point | `['{id}-points']` |
| Polygon | polygon | `['{id}-fill', '{id}-outline']` |
| Line | line | `['{id}-line']` |

---

### setupInteractions()

```typescript
private setupInteractions(): void
```

Registers all map event handlers for user interactions.

**Events Registered**:

#### Click Events

| Layer | Action |
|-------|--------|
| `apelos-clusters` | Zoom to cluster expansion level |
| `apelos-points` | Show popup and update sidebar |

#### Hover Events

| Layer | Enter Action | Leave Action |
|-------|--------------|--------------|
| `apelos-clusters` | Change cursor to pointer | Reset cursor |
| `apelos-points` | Change cursor + show hover ring | Reset cursor + hide ring |

**Cluster Click Handler**:
```typescript
this.map.on('click', 'apelos-clusters', async (e) => {
  const clusterId = features[0].properties?.cluster_id;
  const source = this.map.getSource('apelos') as GeoJSONSource;
  const zoom = await source.getClusterExpansionZoom(clusterId);
  
  this.map.easeTo({
    center: coordinates,
    zoom: zoom || 14,
    duration: 500
  });
});
```

**Point Click Handler**:
```typescript
this.map.on('click', 'apelos-points', (e) => {
  const props = e.features[0].properties;
  const html = this.createPopupContent(props);
  
  this.popup.setLngLat(coordinates).setHTML(html).addTo(this.map);
  this.updateSidebar(props);
});
```

**Hover Effect Implementation**:
```typescript
this.map.on('mouseenter', 'apelos-points', (e) => {
  const name = e.features[0].properties?.Name || '';
  this.map.setFilter('apelos-hover', [
    'all',
    ['!', ['has', 'point_count']],
    ['==', ['get', 'Name'], name]
  ]);
});

this.map.on('mouseleave', 'apelos-points', () => {
  this.map.setFilter('apelos-hover', [
    'all',
    ['!', ['has', 'point_count']],
    ['==', ['get', 'Name'], '']
  ]);
});
```

---

### createPopupContent()

```typescript
private createPopupContent(props: Record<string, unknown>): string
```

Generates HTML content for feature popup.

**Parameters**:
- `props: Record<string, unknown>` - Feature properties from GeoJSON

**Returns**: HTML string

**Template**:
```html
<div class="popup-content">
  <h3>{Name || 'Sem informação'}</h3>
  <p>{Description || 'Descrição não disponível'}</p>
  {Link ? <a href="{Link}" target="_blank">Ver documento →</a> : ''}
</div>
```

**Properties Used**:
- `Name`: Feature title
- `Description`: Detailed text
- `Link`: Optional external URL

**Safety**:
- Handles missing properties
- Provides fallback text
- Conditional rendering of link

---

### updateSidebar()

```typescript
private updateSidebar(props: Record<string, unknown>): void
```

Updates the sidebar information panel with feature details.

**Parameters**:
- `props: Record<string, unknown>` - Feature properties

**DOM Target**: `#info` element

**Template**:
```html
<h3>{Name || 'Sem informação'}</h3>
<div class="info-description">{Description || 'Descrição não disponível'}</div>
{Link ? <a href="{Link}" target="_blank" class="info-link">Acessar documento original →</a> : ''}
```

**Synchronization**:
- Called immediately after popup creation
- Ensures sidebar and popup show same information

---

## Configuration Objects

### MAP_CONFIG

```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068] as [number, number],
  zoom: 13,
  pitch: 0,
  bearing: 0,
}
```

**Properties**:
- `center`: `[longitude, latitude]` - Initial map center
- `zoom`: `number` - Initial zoom level (0-22)
- `pitch`: `number` - Camera tilt in degrees (0-60)
- `bearing`: `number` - Map rotation in degrees (0-360)

---

### LAYERS Configuration

```typescript
const LAYERS: LayerConfig[] = [
  {
    id: 'apelos',
    name: 'Apelos (Appeals)',
    file: 'apelos_clean.geojson',
    type: 'point',
    visible: true,
    color: '#C1272D',
    category: 'main',
  },
  {
    id: 'filtro-bairros',
    name: 'Bairros Filtrados (Filtered Neighborhoods)',
    file: 'filtro_bairros.geojson',
    type: 'polygon',
    visible: false,
    color: '#E8862E',
    category: 'main',
  }
]
```

**LayerConfig Interface**:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the layer |
| `name` | `string` | Display name in UI |
| `file` | `string` | GeoJSON filename (relative to `/data/`) |
| `type` | `'point' \| 'polygon' \| 'line'` | Geometry type |
| `visible` | `boolean` | Initial visibility state |
| `color` | `string` | Primary color (hex format) |
| `category` | `'main' \| 'context'` | Layer category (for future grouping) |

---

## GeoJSON Data Format

### Expected Structure

```typescript
interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

interface Feature {
  type: 'Feature';
  geometry: Geometry;
  properties: {
    Name?: string;
    Description?: string;
    Link?: string;
    [key: string]: any;
  };
}
```

### Example GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-43.1895, -22.9068]
      },
      "properties": {
        "Name": "Apelo #123",
        "Description": "Detailed description of the appeal...",
        "Link": "https://example.com/document.pdf"
      }
    }
  ]
}
```

---

## MapLibre GL JS Integration

### Map Instance

```typescript
this.map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/streets-v2/style.json?key={KEY}',
  center: [-43.1895, -22.9068],
  zoom: 13,
  pitch: 0,
  bearing: 0
});
```

### Controls Used

#### NavigationControl
```typescript
this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
```
- Zoom in/out buttons
- Compass rotation control

#### ScaleControl
```typescript
this.map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
```
- Distance scale bar
- Metric and imperial units

#### FullscreenControl
```typescript
this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
```
- Fullscreen toggle button

### Popup

```typescript
this.popup = new maplibregl.Popup({
  closeButton: true,
  closeOnClick: false,
  maxWidth: '400px'
});
```

**Methods Used**:
- `setLngLat([lng, lat])` - Position popup
- `setHTML(html)` - Set content
- `addTo(map)` - Display popup

---

## Event Handling

### Event Types

| Event | Layer | Callback Signature |
|-------|-------|-------------------|
| `click` | `apelos-clusters` | `(e: MapLayerMouseEvent) => void` |
| `click` | `apelos-points` | `(e: MapLayerMouseEvent) => void` |
| `mouseenter` | `apelos-clusters` | `() => void` |
| `mouseleave` | `apelos-clusters` | `() => void` |
| `mouseenter` | `apelos-points` | `(e: MapLayerMouseEvent) => void` |
| `mouseleave` | `apelos-points` | `() => void` |

### Event Properties

```typescript
interface MapLayerMouseEvent {
  point: { x: number; y: number };
  lngLat: { lng: number; lat: number };
  features?: Feature[];
  originalEvent: MouseEvent;
}
```

---

## CSS Classes

### Component Classes

| Class | Component | Description |
|-------|-----------|-------------|
| `.layer-control` | Layer Panel | Main container |
| `.layer-control-header` | Layer Panel | Header with title |
| `.layer-control-toggle` | Layer Panel | Collapse button |
| `.layer-control-content` | Layer Panel | Scrollable content area |
| `.layer-item` | Layer Panel | Individual layer checkbox |
| `.layer-color` | Layer Panel | Color indicator |
| `.layer-name` | Layer Panel | Layer name text |
| `.popup-content` | Popup | Popup container |
| `.info-panel` | Sidebar | Information panel |
| `.sidebar-header` | Sidebar | Sidebar header |
| `.sidebar-footer` | Sidebar | Sidebar footer |

### State Classes

| Class | Purpose |
|-------|---------|
| `.collapsed` | Layer control is collapsed |
| `.loading` | Loading animation |
| `.error` | Error state display |

---

## Environment Configuration

### Required Variables

```bash
VITE_MAPTILER_KEY=your_api_key_here
```

### Optional Variables

```bash
VITE_APP_TITLE="Custom Title"
VITE_APP_DESCRIPTION="Custom description"
```

### Access in Code

```typescript
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
```

---

## Error Handling

### Missing API Key

```typescript
if (!MAPTILER_KEY) {
  console.error('MapTiler API key not found!');
  document.getElementById('info')!.innerHTML = `
    <div class="error">
      <h3>⚠️ Configuração Necessária</h3>
      <p>A chave de API do MapTiler não foi configurada.</p>
      ...
    </div>
  `;
  return;
}
```

### Layer Loading Errors

```typescript
try {
  const response = await fetch(`${basePath}data/${layer.file}`);
  const data: FeatureCollection = await response.json();
  // Process layer...
} catch (error) {
  console.error(`Error loading layer ${layer.name}:`, error);
  // Continue with other layers
}
```

### Cluster Expansion Errors

```typescript
try {
  const zoom = await source.getClusterExpansionZoom(clusterId);
  this.map.easeTo({ center, zoom: zoom || 14 });
} catch (err) {
  console.error('Error expanding cluster:', err);
}
```

---

## Performance Considerations

### Clustering Configuration

```typescript
this.map.addSource('apelos', {
  type: 'geojson',
  data: data,
  cluster: true,
  clusterMaxZoom: 16,  // Don't cluster at zoom 17+
  clusterRadius: 50     // Cluster points within 50px
});
```

**Benefits**:
- Reduces render load for many points
- Improves interaction performance
- Better visual clarity at low zoom

### Layer Visibility

Only renders visible layers:
```typescript
layout: {
  visibility: layer.visible ? 'visible' : 'none'
}
```

**Benefits**:
- Skips rendering of hidden layers
- Faster map updates
- Lower memory usage

---

## Browser Compatibility

### Required Features

- **ES2020 JavaScript**
- **WebGL 1.0** or higher
- **Fetch API**
- **CSS Grid**
- **CSS Variables**

### Polyfills

None required for modern browsers (2020+).

For older browser support, consider:
- `core-js` for ES2020 features
- WebGL polyfills (limited effectiveness)

---

## Debugging

### Console Logging

**Layer Loading**:
```
Loaded layer: Apelos (Appeals) (342 features)
Loaded layer: Bairros Filtrados (15 features)
```

**Errors**:
```
Error loading layer {name}: {error}
Error expanding cluster: {error}
MapTiler API key not found!
```

### Browser DevTools

**Inspect Map State**:
```javascript
// In browser console
window.map = app.map;  // Expose map instance
window.map.getStyle();  // Get current style
window.map.getSources();  // List all sources
```

---

## Migration Guide

### From v0.x to v1.0

**Breaking Changes**:
- Moved to TypeScript
- New layer configuration format
- Changed CSS class names

**Migration Steps**:

1. **Update Layer Config**:
```typescript
// Old
const layers = [{ id: 'layer1', color: 'red' }];

// New
const LAYERS: LayerConfig[] = [{
  id: 'layer1',
  name: 'Layer 1',
  file: 'data.geojson',
  type: 'point',
  visible: true,
  color: '#FF0000',
  category: 'main'
}];
```

2. **Update CSS Classes**:
- `.legend` → `.layer-control`
- `.legend-item` → `.layer-item`

3. **Update Environment Variables**:
- Prefix all with `VITE_`

---

## Changelog

### v1.0.0 (2025-10-01)

**Added**:
- TypeScript support
- Layer control panel
- Clustered point rendering
- Hover effects
- Comprehensive documentation

**Changed**:
- Migrated from JavaScript to TypeScript
- Improved popup styling
- Enhanced error handling

**Fixed**:
- Mobile responsiveness issues
- Layer visibility bugs
- Memory leaks in event handlers

---

*Last updated: October 2025*


