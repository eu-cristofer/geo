# Web Application - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [System Design](#system-design)
4. [Class Structure](#class-structure)
5. [Data Flow](#data-flow)
6. [Component Documentation](#component-documentation)
7. [Deployment Architecture](#deployment-architecture)
8. [API Reference](#api-reference)
9. [Configuration](#configuration)
10. [Performance Optimization](#performance-optimization)

---

## Overview

### Purpose
Interactive web mapping application for visualizing historical appeals (apelos) from the Estado Novo period in Rio de Janeiro, specifically related to expropriations for Avenida Presidente Vargas construction.

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Build Tool** | Vite | 5.4.8 | Fast build and dev server |
| **Language** | TypeScript | 5.6.2 | Type-safe development |
| **Mapping** | MapLibre GL JS | 4.7.1 | Map rendering engine |
| **Map Tiles** | MapTiler | API | Basemap tiles and styles |
| **Data Format** | GeoJSON | - | Geographic data storage |

### Key Features

- ✅ **Point Clustering** - Automatic clustering at low zoom levels
- ✅ **Interactive Popups** - Detailed information on click
- ✅ **Layer Control** - Toggle visibility of map layers
- ✅ **Responsive Design** - Mobile and desktop support
- ✅ **Performance Optimized** - Code splitting, compression, caching
- ✅ **Multi-Deployment** - Supports Vercel, Netlify, GitHub Pages, Docker

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────┐     │
│  │            │    │              │    │             │     │
│  │  HTML/CSS  │───▶│  TypeScript  │───▶│  MapLibre   │     │
│  │  Template  │    │  Application │    │  GL Engine  │     │
│  │            │    │              │    │             │     │
│  └────────────┘    └──────────────┘    └─────────────┘     │
│                            │                    │            │
│                            ▼                    ▼            │
│                    ┌──────────────┐    ┌─────────────┐     │
│                    │   GeoJSON    │    │  MapTiler   │     │
│                    │   Data       │    │  Tiles API  │     │
│                    └──────────────┘    └─────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Deployment Infrastructure                        │
├─────────────────────────────────────────────────────────────┤
│  Vercel  │  Netlify  │  GitHub Pages  │  Docker  │  Custom  │
└─────────────────────────────────────────────────────────────┘
```

### Application Layer Architecture

```
┌──────────────────────────────────────────────────┐
│                 Presentation Layer                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │  Sidebar   │  │   Map      │  │   Layer    │ │
│  │  Panel     │  │   View     │  │  Control   │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Application Logic Layer              │
│  ┌──────────────────────────────────────────┐   │
│  │         ApelosMap Class                   │   │
│  │  ┌────────────────────────────────────┐  │   │
│  │  │ - Map Initialization               │  │   │
│  │  │ - Layer Management                 │  │   │
│  │  │ - Event Handling                   │  │   │
│  │  │ - Popup Control                    │  │   │
│  │  │ - UI State Management              │  │   │
│  │  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│                  Data Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │  GeoJSON   │  │  MapTiler  │  │   Config   │ │
│  │   Files    │  │    API     │  │   Data     │ │
│  └────────────┘  └────────────┘  └────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## System Design

### Application Flow Diagram

```mermaid
flowchart TD
    A[Application Start] --> B{MapTiler Key?}
    B -->|No| C[Show Error Message]
    B -->|Yes| D[Initialize MapLibre Map]
    
    D --> E[Add Map Controls]
    E --> F[Initialize Layer States]
    F --> G[Wait for Map Load Event]
    
    G --> H[Load All Layers]
    H --> I{For Each Layer}
    
    I --> J[Fetch GeoJSON Data]
    J --> K{Layer Type?}
    
    K -->|Point Apelos| L[Add Clustered Source]
    K -->|Point Regular| M[Add Regular Point Source]
    K -->|Polygon| N[Add Polygon Source]
    K -->|Line| O[Add Line Source]
    
    L --> P[Add Apelos Layers]
    M --> Q[Add Point Layer]
    N --> R[Add Polygon Layers]
    O --> S[Add Line Layer]
    
    P --> T{More Layers?}
    Q --> T
    R --> T
    S --> T
    
    T -->|Yes| I
    T -->|No| U[Setup Interactions]
    
    U --> V[Create Layer Control]
    V --> W[Application Ready]
    
    W --> X[User Interaction]
    X --> Y{Event Type?}
    
    Y -->|Click Cluster| Z[Zoom to Cluster]
    Y -->|Click Point| AA[Show Popup]
    Y -->|Hover Point| AB[Show Hover Effect]
    Y -->|Toggle Layer| AC[Update Visibility]
    
    Z --> X
    AA --> AD[Update Sidebar]
    AD --> X
    AB --> X
    AC --> X
```

### Layer Loading Sequence

```mermaid
sequenceDiagram
    participant App as ApelosMap
    participant Map as MapLibre Map
    participant API as Data API
    participant UI as User Interface
    
    App->>Map: Initialize Map
    Map-->>App: Load Event
    
    loop For Each Layer
        App->>API: Fetch GeoJSON
        API-->>App: Return Data
        
        App->>Map: Add Source
        Map-->>App: Source Added
        
        alt Apelos Layer
            App->>Map: Add Cluster Layer
            App->>Map: Add Count Layer
            App->>Map: Add Points Layer
            App->>Map: Add Hover Layer
        else Other Layers
            App->>Map: Add Appropriate Layer(s)
        end
        
        Map-->>App: Layers Added
    end
    
    App->>Map: Setup Click Handlers
    App->>Map: Setup Hover Handlers
    App->>UI: Create Layer Control
    App->>UI: Update Info Panel
    
    UI-->>App: Ready for Interaction
```

### User Interaction Flow

```mermaid
stateDiagram-v2
    [*] --> MapLoaded
    
    MapLoaded --> Idle
    
    Idle --> HoveringCluster: Mouse over cluster
    Idle --> HoveringPoint: Mouse over point
    Idle --> ClickingCluster: Click cluster
    Idle --> ClickingPoint: Click point
    Idle --> TogglingLayer: Toggle layer checkbox
    
    HoveringCluster --> Idle: Mouse leave
    HoveringPoint --> Idle: Mouse leave
    HoveringPoint --> ShowingHoverEffect: Display hover ring
    ShowingHoverEffect --> Idle: Mouse leave
    
    ClickingCluster --> ZoomingIn: Calculate zoom level
    ZoomingIn --> Idle: Animation complete
    
    ClickingPoint --> ShowingPopup: Create popup
    ShowingPopup --> UpdatingSidebar: Update info panel
    UpdatingSidebar --> Idle: Display complete
    
    TogglingLayer --> UpdatingVisibility: Set layer visibility
    UpdatingVisibility --> Idle: Update complete
    
    Idle --> [*]: App closed
```

---

## Class Structure

### UML Class Diagram

```mermaid
classDiagram
    class ApelosMap {
        -Map map
        -Popup popup
        -Map~string,boolean~ layerStates
        
        +constructor()
        -initMap() Promise~void~
        -loadAllLayers() Promise~void~
        -addApelosLayers(layer: LayerConfig) void
        -addPointLayer(layer: LayerConfig) void
        -addPolygonLayer(layer: LayerConfig) void
        -addLineLayer(layer: LayerConfig) void
        -createLayerControl() void
        -toggleLayer(layerId: string, visible: boolean) void
        -getLayerIds(baseId: string) string[]
        -setupInteractions() void
        -createPopupContent(props: Record) string
        -updateSidebar(props: Record) void
    }
    
    class LayerConfig {
        <<interface>>
        +string id
        +string name
        +string file
        +string type
        +boolean visible
        +string color
        +string category
    }
    
    class MapConfig {
        <<const>>
        +number[] center
        +number zoom
        +number pitch
        +number bearing
    }
    
    class MapLibreMap {
        <<external>>
        +addControl()
        +addSource()
        +addLayer()
        +on()
        +queryRenderedFeatures()
        +setLayoutProperty()
        +getSource()
        +easeTo()
    }
    
    class MapLibrePopup {
        <<external>>
        +setLngLat()
        +setHTML()
        +addTo()
    }
    
    class GeoJSONSource {
        <<external>>
        +getClusterExpansionZoom()
    }
    
    ApelosMap --> MapLibreMap: uses
    ApelosMap --> MapLibrePopup: uses
    ApelosMap --> LayerConfig: configures
    ApelosMap --> MapConfig: uses
    MapLibreMap --> GeoJSONSource: provides
```

### Class Responsibilities

#### ApelosMap Class

**Single Responsibility**: Manages the entire map application lifecycle

**Key Methods**:

| Method | Responsibility | Async |
|--------|---------------|-------|
| `constructor()` | Initialize map and popup instances | No |
| `initMap()` | Setup map controls and event handlers | Yes |
| `loadAllLayers()` | Fetch and add all data layers | Yes |
| `addApelosLayers()` | Create clustered point layers | No |
| `addPointLayer()` | Create simple point layer | No |
| `addPolygonLayer()` | Create fill and outline layers | No |
| `addLineLayer()` | Create line layer | No |
| `createLayerControl()` | Build layer visibility UI | No |
| `toggleLayer()` | Show/hide map layers | No |
| `setupInteractions()` | Wire up click and hover events | No |
| `createPopupContent()` | Generate popup HTML | No |
| `updateSidebar()` | Update info panel content | No |

---

## Data Flow

### Data Loading Flow

```mermaid
flowchart LR
    A[Public/Data] -->|Fetch| B[GeoJSON Files]
    B --> C{Parse JSON}
    C --> D[FeatureCollection]
    D --> E[MapLibre Source]
    E --> F[Map Layers]
    F --> G[Visual Rendering]
    
    H[Environment] -->|API Key| I[MapTiler]
    I --> J[Basemap Tiles]
    J --> G
```

### Event Data Flow

```mermaid
flowchart TD
    A[User Click/Hover] --> B[MapLibre Event]
    B --> C[Query Features]
    C --> D{Feature Found?}
    
    D -->|Yes| E[Extract Properties]
    D -->|No| F[Return to Idle]
    
    E --> G{Event Type?}
    
    G -->|Click Cluster| H[Get Cluster Zoom]
    H --> I[Animate to Zoom]
    
    G -->|Click Point| J[Create Popup HTML]
    J --> K[Show Popup]
    K --> L[Update Sidebar]
    
    G -->|Hover Point| M[Update Filter]
    M --> N[Show Hover Ring]
    
    I --> F
    L --> F
    N --> O[Mouse Leave] --> F
```

### State Management Flow

```mermaid
flowchart TD
    A[Layer States Map] -->|Initialize| B[Default Visibility]
    B --> C[Render Layers]
    
    D[User Toggle] --> E[Update State]
    E --> F[Get Affected Layer IDs]
    F --> G{For Each Layer ID}
    
    G --> H[Set Layout Property]
    H --> I[Map Re-renders]
    I --> J[Visual Update Complete]
    
    J --> A
```

---

## Component Documentation

### 1. Map Initialization

**File**: `src/main.ts` (lines 79-89)

**Purpose**: Creates the main map instance with MapTiler basemap

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

**Configuration**:
- **Container**: DOM element ID for map rendering
- **Style**: MapTiler style URL with API key
- **Center**: Initial map center `[-43.1895, -22.9068]` (Rio de Janeiro)
- **Zoom**: Initial zoom level (13)

---

### 2. Layer System

#### Layer Types

**Apelos (Clustered Points)**

```mermaid
graph TD
    A[Apelos Source] --> B[Clusters Layer]
    A --> C[Cluster Count Layer]
    A --> D[Points Layer]
    A --> E[Hover Effect Layer]
    
    B --> F[Circles - Sized by count]
    C --> G[Text - Show count]
    D --> H[Circles - Individual points]
    E --> I[Circles - Hover ring]
```

**Configuration**:
- Clustering enabled with `clusterMaxZoom: 16` and `clusterRadius: 50`
- Color coding by point count (yellow → orange → red)
- Circle size increases with cluster size

**Polygon Layers**

```mermaid
graph TD
    A[Polygon Source] --> B[Fill Layer]
    A --> C[Outline Layer]
    
    B --> D[Semi-transparent fill]
    C --> E[Solid border]
```

**Point Layers**

```mermaid
graph TD
    A[Point Source] --> B[Circle Layer]
    B --> C[Styled markers]
```

**Line Layers**

```mermaid
graph TD
    A[Line Source] --> B[Line Layer]
    B --> C[Styled paths]
```

---

### 3. Layer Control Panel

**Location**: Top-right overlay on map

**Structure**:

```
┌─────────────────────────────┐
│ Camadas do Mapa          [▼]│
├─────────────────────────────┤
│ ☑ ■ Apelos (Appeals)        │
│ ☐ ■ Bairros Filtrados       │
└─────────────────────────────┘
```

**Features**:
- Collapsible panel
- Color-coded layer indicators
- Real-time visibility toggle
- Persistent state management

**Implementation** (lines 311-357):
1. Creates DOM structure dynamically
2. Adds checkboxes for each layer
3. Wires change events to `toggleLayer()`
4. Updates all associated map layers

---

### 4. Popup System

**Trigger**: Click on unclustered point

**Content Structure**:

```html
<div class="popup-content">
  <h3>{Name}</h3>
  <p>{Description}</p>
  <a href="{Link}">Ver documento →</a>
</div>
```

**Dual Display**:
1. **Map Popup**: Positioned at feature coordinates
2. **Sidebar Panel**: Synchronized content in left panel

**Data Binding**:
- Reads from GeoJSON feature properties
- Sanitizes and formats content
- Handles missing data gracefully

---

### 5. Interaction System

#### Click Handlers

```mermaid
graph TD
    A[Click Event] --> B{Target Layer?}
    
    B -->|Cluster| C[Get Cluster ID]
    C --> D[Calculate Expansion Zoom]
    D --> E[Animate Camera]
    
    B -->|Point| F[Extract Properties]
    F --> G[Create Popup]
    G --> H[Update Sidebar]
    
    B -->|Background| I[No Action]
```

#### Hover Handlers

```mermaid
graph TD
    A[Mouse Enter] --> B{Layer Type?}
    B -->|Cluster| C[Change Cursor]
    B -->|Point| D[Change Cursor + Show Ring]
    
    E[Mouse Leave] --> F[Reset Cursor]
    F --> G[Hide Ring]
```

**Implementation Details**:
- Uses MapLibre event system
- Queries rendered features at pixel coordinates
- Filters hover layer dynamically based on feature name

---

## Deployment Architecture

### Multi-Platform Deployment

```mermaid
graph TD
    A[Source Code] --> B{Build Process}
    B --> C[TypeScript Compilation]
    C --> D[Vite Bundle]
    D --> E[Asset Optimization]
    E --> F[Compression]
    
    F --> G[Build Artifacts]
    
    G --> H[Vercel]
    G --> I[Netlify]
    G --> J[GitHub Pages]
    G --> K[Docker Container]
    G --> L[Custom Server]
    
    M[Environment Variables] --> B
    N[GeoJSON Data] --> G
```

### Build Pipeline

```mermaid
flowchart LR
    A[npm run build] --> B[TypeScript Check]
    B --> C[Vite Build]
    C --> D[Code Splitting]
    D --> E[Minification]
    E --> F[Tree Shaking]
    F --> G[Gzip/Brotli]
    G --> H[dist/ Output]
```

**Optimizations**:
1. **Code Splitting**: MapLibre in separate chunk
2. **Minification**: Terser with console removal
3. **Compression**: Gzip and Brotli variants
4. **Asset Hashing**: Cache-friendly file names

### Deployment Configurations

#### Vercel (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Features**:
- Automatic HTTPS
- Edge caching
- Environment variable injection
- Zero-config deployment

#### Netlify (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Features**:
- Asset optimization
- Header configuration
- Redirect rules
- Form handling

#### Docker (`Dockerfile`)

**Multi-stage Build**:
1. **Stage 1**: Build application
2. **Stage 2**: Nginx production server

**Features**:
- Minimal image size
- Health checks
- Custom nginx config
- Static asset serving

---

## API Reference

### Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_MAPTILER_KEY` | string | ✅ | MapTiler API key for basemap tiles |
| `VITE_APP_TITLE` | string | ❌ | Custom application title |
| `VITE_APP_DESCRIPTION` | string | ❌ | Custom app description |

### Configuration Constants

#### MAP_CONFIG

```typescript
const MAP_CONFIG = {
  center: [-43.1895, -22.9068] as [number, number],
  zoom: 13,
  pitch: 0,
  bearing: 0,
}
```

#### LAYERS

```typescript
interface LayerConfig {
  id: string;           // Unique layer identifier
  name: string;         // Display name
  file: string;         // GeoJSON filename
  type: 'point' | 'polygon' | 'line';
  visible: boolean;     // Initial visibility
  color: string;        // Primary color (hex)
  category: 'main' | 'context';
}
```

### GeoJSON Data Structure

**Expected Feature Properties**:

```typescript
interface ApelosProperties {
  Name?: string;        // Appeal name/title
  Description?: string; // Detailed description
  Link?: string;        // External document URL
}
```

**File Locations**:
- Development: `/public/data/`
- Production: `/dist/data/`

---

## Configuration

### Vite Configuration (`vite.config.ts`)

**Key Settings**:

```typescript
{
  base: '/geo/',              // GitHub Pages path
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl'],  // Separate chunk
        }
      }
    }
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

**Compiler Options**:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Bundle mode for Vite

### Styling System

**CSS Variables** (`src/style.css`):

```css
:root {
  --primary-color: #C1272D;    /* Red */
  --secondary-color: #E8862E;  /* Orange */
  --accent-color: #E8B931;     /* Yellow */
  --text-dark: #2c3e50;
  --text-light: #666;
  --bg-light: #f8f9fa;
  --border-color: #e1e8ed;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

**Responsive Breakpoints**:
- Mobile: `@media (max-width: 768px)`

---

## Performance Optimization

### Bundle Analysis

**Production Build Size**:

```
dist/
├── index.html           ~2 KB
├── assets/
│   ├── index.[hash].css     ~8 KB (gzipped: ~2 KB)
│   ├── index.[hash].js      ~25 KB (gzipped: ~8 KB)
│   └── maplibre.[hash].js   ~180 KB (gzipped: ~60 KB)
└── data/
    ├── apelos_clean.geojson     ~varies
    └── filtro_bairros.geojson   ~varies
```

### Loading Performance

```mermaid
gantt
    title Page Load Timeline
    dateFormat X
    axisFormat %Ls
    
    section Initial
    HTML Parse      :0, 100
    CSS Load        :100, 200
    JS Parse        :200, 500
    
    section MapLibre
    Library Load    :500, 1500
    Map Init        :1500, 2000
    
    section Data
    GeoJSON Fetch   :2000, 2500
    Layer Render    :2500, 3000
    
    section Interactive
    Event Setup     :3000, 3200
    UI Ready        :3200, 3300
```

### Optimization Strategies

1. **Code Splitting**
   - MapLibre in separate chunk
   - Lazy load non-critical features

2. **Asset Optimization**
   - Terser minification
   - Gzip + Brotli compression
   - Cache headers (1 year for assets)

3. **Runtime Performance**
   - GeoJSON clustering for points
   - Debounced event handlers
   - Efficient DOM updates

4. **Network Optimization**
   - CDN delivery (Vercel/Netlify)
   - HTTP/2 push
   - Preconnect to MapTiler

### Caching Strategy

```mermaid
graph TD
    A[Request] --> B{Resource Type?}
    
    B -->|HTML| C[No Cache]
    B -->|JS/CSS| D[Immutable - 1 year]
    B -->|GeoJSON| E[1 hour]
    B -->|Map Tiles| F[MapTiler Cache]
    
    C --> G[Browser]
    D --> G
    E --> G
    F --> G
```

---

## Security Considerations

### Content Security Policy

**Netlify Headers**:
```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### API Key Management

**Best Practices**:
1. ✅ Store in environment variables
2. ✅ Never commit to repository
3. ✅ Use `.env.example` for documentation
4. ✅ Rotate keys periodically
5. ✅ Restrict key domains in MapTiler dashboard

### Data Validation

**GeoJSON Parsing**:
- Type checking for FeatureCollection
- Property existence validation
- Graceful error handling

---

## Testing & Quality Assurance

### Type Safety

**TypeScript Coverage**: 100%

**Key Type Definitions**:
```typescript
import type { FeatureCollection } from 'geojson';

interface LayerConfig { /* ... */ }
type LayerType = 'point' | 'polygon' | 'line';
```

### Browser Support

**Tested Browsers**:
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Mobile Devices**:
- iOS Safari 14+ ✅
- Chrome Android 90+ ✅

### Accessibility

**WCAG 2.1 Level AA Compliance**:
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Color contrast ratios
- ✅ Focus indicators
- ✅ Screen reader support

---

## Development Workflow

### Local Development

```mermaid
flowchart LR
    A[git clone] --> B[npm install]
    B --> C[Create .env]
    C --> D[npm run dev]
    D --> E[Browser: localhost:3000]
    
    E --> F[Edit Code]
    F --> G[Hot Reload]
    G --> E
```

### Production Build

```mermaid
flowchart LR
    A[npm run build] --> B[TypeScript Check]
    B --> C[Vite Build]
    C --> D[Asset Optimization]
    D --> E[dist/ Output]
    
    E --> F{Deploy To?}
    F -->|Vercel| G[vercel]
    F -->|Netlify| H[netlify deploy]
    F -->|GitHub| I[git push]
    F -->|Docker| J[docker build]
```

### CI/CD Pipeline

**GitHub Actions** (if configured):

```mermaid
graph TD
    A[Push to main] --> B[Run Tests]
    B --> C[TypeScript Check]
    C --> D[Build]
    D --> E{Success?}
    
    E -->|Yes| F[Deploy to Production]
    E -->|No| G[Notify Failure]
    
    F --> H[Run Health Checks]
    H --> I[Complete]
```

---

## Troubleshooting

### Common Issues

#### 1. MapTiler Key Error

**Symptom**: Error message in sidebar
**Solution**:
1. Get key from https://maptiler.com
2. Add to `.env`: `VITE_MAPTILER_KEY=your_key`
3. Restart dev server

#### 2. GeoJSON Not Loading

**Symptom**: Layers not appearing
**Solution**:
1. Check file paths in `public/data/`
2. Verify GeoJSON structure
3. Check browser console for errors
4. Ensure correct BASE_URL in production

#### 3. Build Failures

**Symptom**: TypeScript errors
**Solution**:
1. Run `npm run type-check`
2. Fix type errors
3. Ensure dependencies are installed
4. Clear cache: `rm -rf node_modules/.vite`

---

## Future Enhancements

### Planned Features

1. **Advanced Filtering**
   - Date range filters
   - Property-based search
   - Multi-layer queries

2. **Data Export**
   - CSV export
   - PDF reports
   - Share links

3. **Analytics**
   - Usage tracking
   - Heatmaps
   - Statistics dashboard

4. **Offline Support**
   - Service worker
   - Cached tiles
   - Local storage

### Performance Roadmap

```mermaid
gantt
    title Optimization Roadmap
    dateFormat YYYY-MM-DD
    
    section Q1
    Implement Service Worker    :2025-01-01, 30d
    Add Vector Tiles           :2025-02-01, 45d
    
    section Q2
    Lazy Load Components       :2025-04-01, 20d
    WebGL Acceleration        :2025-05-01, 30d
    
    section Q3
    Progressive Web App        :2025-07-01, 45d
```

---

## Appendix

### File Structure Reference

```
web/
├── src/
│   ├── main.ts              # Application entry point (497 lines)
│   ├── style.css            # Global styles (373 lines)
│   └── vite-env.d.ts        # Vite type definitions
│
├── public/
│   └── data/
│       ├── apelos_clean.geojson
│       └── filtro_bairros.geojson
│
├── dist/                    # Build output
│   ├── index.html
│   ├── assets/
│   └── data/
│
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Build config
│
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose
├── nginx.conf              # Nginx config
├── netlify.toml            # Netlify config
└── vercel.json             # Vercel config
```

### Dependencies

#### Production Dependencies

```json
{
  "maplibre-gl": "^4.7.1",    // Map rendering
  "pmtiles": "^3.0.7"         // Tile format (future use)
}
```

#### Development Dependencies

```json
{
  "@types/geojson": "^7946.0.14",
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "@typescript-eslint/parser": "^7.0.0",
  "eslint": "^8.57.0",
  "terser": "^5.44.0",
  "typescript": "^5.6.2",
  "vite": "^5.4.8",
  "vite-plugin-compression": "^0.5.1"
}
```

### Glossary

| Term | Definition |
|------|------------|
| **Apelos** | Historical appeals from Estado Novo period |
| **Clustering** | Grouping nearby points at low zoom levels |
| **GeoJSON** | Geographic data format (JSON-based) |
| **MapLibre** | Open-source map rendering library |
| **MapTiler** | Map tile and style provider |
| **Vite** | Fast build tool and dev server |

---

## Contact & Support

**Authors**:
- Francesca Dalmagro Martinelli
- Cristofer Antoni Souza Costa

**Repository**: GitHub
**Issues**: Use GitHub Issues for bug reports
**Documentation**: Updated October 2025

---

*This documentation was generated for web application version 1.0.0*


