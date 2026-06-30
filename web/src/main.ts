// Import MapLibre GL JS for interactive web mapping
import maplibregl, { type StyleSpecification } from 'maplibre-gl';

// Import MapLibre GL's default CSS for map styling
import 'maplibre-gl/dist/maplibre-gl.css';

// Import custom application styles
import './style.css';

// Import the GeoJSON FeatureCollection type for type safety
import type { FeatureCollection } from 'geojson';

// MapTiler API key - Get your free key at https://www.maptiler.com/cloud/
// For production, use environment variables
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// Single brand color for every feature on the map. This is the dominant
// yellow used in the original Apelos points (KML "fbc02d"); we now apply it
// uniformly to points, clusters, and neighborhood polygons.
const FEATURE_COLOR = '#fbc02d';

// Boundary color for the municipal limit layer. Deliberately not the brand
// yellow so the city outline reads as an administrative limit, distinct from the
// data features (apelos points / filtered bairros).
const CITY_LIMIT_COLOR = '#d32f2f';

// Optional Stadia Maps key for the Stamen vintage basemaps. Stadia tiles work
// key-less from localhost and authorized domains; for the deployed GitHub Pages
// site, register a free key at stadiamaps.com, authorize the domain, and set
// VITE_STADIA_KEY. Without it the watercolor map still works in local dev.
const STADIA_KEY = import.meta.env.VITE_STADIA_KEY || '';

// Builds a MapTiler style URL for a given map id, using the shared API key.
const basemapStyleUrl = (mapId: string): string =>
  `https://api.maptiler.com/maps/${mapId}/style.json?key=${MAPTILER_KEY}`;

// Glyphs (fonts) for the raster basemaps below. Our data layers include a symbol
// layer (apelos cluster counts, "Noto Sans Bold") that needs a glyph source;
// MapTiler's font endpoint provides it and we already require the MapTiler key,
// so we reuse it rather than introduce a second font provider.
const GLYPHS_URL = `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`;

// A basemap is either a MapTiler vector style (referenced by slug) or a raster
// XYZ tile source from another provider. The raster ones are (mostly) key-less,
// so they keep working regardless of the MapTiler plan and add visual variety.
// Labels stay in Portuguese per the project's bilingual convention.
interface VectorBasemap {
  kind?: 'vector';
  id: string;
  label: string;
  mapId: string; // MapTiler style slug
}

interface RasterBasemap {
  kind: 'raster';
  id: string;
  label: string;
  tiles: string[]; // XYZ tile URL templates
  attribution: string; // required by each provider's terms of use
  maxzoom?: number; // provider's max native zoom (MapLibre overzooms past it)
  tileSize?: number; // standard XYZ tiles are 256; MapLibre defaults to 512
}

type Basemap = VectorBasemap | RasterBasemap;

const BASEMAPS: Basemap[] = [
  // --- MapTiler vector styles (require VITE_MAPTILER_KEY) ---
  { id: 'streets', label: 'Ruas', mapId: 'streets-v2' }, // current default
  { id: 'light', label: 'Claro', mapId: 'dataviz' }, // clean, data-overlay friendly
  { id: 'dark', label: 'Escuro', mapId: 'dataviz-dark' },
  { id: 'satellite', label: 'Satélite', mapId: 'hybrid' }, // imagery + labels
  { id: 'satellite-pure', label: 'Satélite limpo', mapId: 'satellite' }, // imagery, no labels — good under 1928 overlay
  { id: 'topo', label: 'Topo', mapId: 'topo-v2' },
  { id: 'outdoor', label: 'Relevo', mapId: 'outdoor-v2' }, // terrain shading, contours, trails
  { id: 'osm', label: 'OpenStreetMap', mapId: 'openstreetmap' },
  { id: 'basic', label: 'Básico', mapId: 'basic-v2' }, // minimal neutral background
  { id: 'toner', label: 'P&B', mapId: 'toner-v2' }, // high-contrast, print

  // --- Key-less raster basemaps from other providers ---
  // Esri World Imagery — high-res aerial, often sharper over Rio than MapTiler's.
  {
    kind: 'raster',
    id: 'esri-imagery',
    label: 'Satélite Esri',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxzoom: 19,
  },
  // CARTO Positron — ultra-clean light basemap, ideal for figures/data overlays.
  {
    kind: 'raster',
    id: 'carto-light',
    label: 'CARTO Claro',
    tiles: 'abcd'.split('').map(s => `https://${s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png`),
    attribution: '© OpenStreetMap contributors © CARTO',
    maxzoom: 20,
  },
  // CARTO Dark Matter — clean dark counterpart.
  {
    kind: 'raster',
    id: 'carto-dark',
    label: 'CARTO Escuro',
    tiles: 'abcd'.split('').map(s => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`),
    attribution: '© OpenStreetMap contributors © CARTO',
    maxzoom: 20,
  },
  // OpenTopoMap — topographic, with contour lines and hillshade.
  {
    kind: 'raster',
    id: 'opentopo',
    label: 'OpenTopoMap',
    tiles: 'abc'.split('').map(s => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`),
    attribution: 'Map data © OpenStreetMap contributors, SRTM | Style © OpenTopoMap (CC-BY-SA)',
    maxzoom: 17,
  },
  // Stamen Watercolor (via Stadia) — vintage hand-painted look for the historical
  // theme. Key-less on localhost; see STADIA_KEY note for the deployed site.
  {
    kind: 'raster',
    id: 'watercolor',
    label: 'Aquarela',
    tiles: [`https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg${STADIA_KEY ? `?api_key=${STADIA_KEY}` : ''}`],
    attribution: '© Stadia Maps © Stamen Design © OpenMapTiles © OpenStreetMap contributors',
    maxzoom: 16,
  },
];

const DEFAULT_BASEMAP = 'streets';

// Builds a raster MapLibre style for a non-MapTiler basemap. Includes a glyphs
// URL so our symbol layers (cluster counts) still render after a swap onto it.
const rasterBasemapStyle = (bm: RasterBasemap): StyleSpecification => ({
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    basemap: {
      type: 'raster',
      tiles: bm.tiles,
      tileSize: bm.tileSize ?? 256,
      attribution: bm.attribution,
      maxzoom: bm.maxzoom ?? 19,
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
});

// Resolves a basemap to whatever `Map#setStyle` accepts: a MapTiler style URL
// (vector) or an inline raster StyleSpecification.
const basemapStyle = (bm: Basemap): string | StyleSpecification =>
  bm.kind === 'raster' ? rasterBasemapStyle(bm) : basemapStyleUrl(bm.mapId);

// Map configuration
const MAP_CONFIG = {
  center: [-43.1895, -22.9068] as [number, number], // Rio de Janeiro center
  zoom: 13,
  pitch: 0,
  bearing: 0,
};

// Layer configuration
interface LayerConfig {
  id: string;
  name: string;
  file: string;
  type: 'point' | 'polygon' | 'line';
  visible: boolean;
  color: string;
  category: 'main' | 'context';
}

// User-adjustable appearance for a data layer (fill color, border color/width,
// opacity). All four map onto MapLibre paint properties, so they apply live via
// setPaintProperty — see paintTargets() / applyLayerStyle().
interface LayerStyle {
  color: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
}

const LAYERS: LayerConfig[] = [
  {
    id: 'apelos',
    name: 'Apelos (Appeals)',
    file: 'apelos_clean_tese.geojson',
    type: 'point',
    visible: true,
    color: FEATURE_COLOR,
    category: 'main',
  },
  {
    id: 'filtro-bairros',
    name: 'Bairros Filtrados (Filtered Neighborhoods)',
    file: 'filtro_bairros_tese.geojson',
    type: 'polygon',
    visible: false,
    color: FEATURE_COLOR,
    category: 'main',
  },
  {
    // Municipal boundary of Rio de Janeiro, dissolved from DATA.RIO bairros via
    // geo.dissolve_boundary (see processed_data/limite_municipio_tese.geojson).
    // Distinct red so it reads as an administrative limit, not a data feature.
    id: 'limite-municipio',
    name: 'Limite do Município (City Limits)',
    file: 'limite_municipio_tese.geojson',
    type: 'polygon',
    visible: false,
    color: CITY_LIMIT_COLOR,
    category: 'context',
  },
];

// Georeferenced 1928 aerial montage shown as a "then-and-now" overlay. Rendered
// as a single MapLibre `image` source/layer; the user picks a visual *version*
// (color, grayscale, contours, ...) which only swaps the image via
// ImageSource.updateImage — the geometry never changes. The optimized WebPs live
// in web/public/historical/ and the four corner coordinates (top-left,
// top-right, bottom-right, bottom-left, in WGS84) come from
// `geo.export_raster_overlay_variants` on the source GeoTIFF (SIRGAS 2000 /
// UTM 23S). See web/public/historical/aero_1928_manifest.json. The variant list
// is hardcoded here (like BASEMAPS); the manifest is the reproducible record.
interface OverlayVariant {
  id: string;
  label: string;
  file: string; // resolved against import.meta.env.BASE_URL
}

const HISTORICAL_OVERLAY = {
  id: 'aero-1928',
  label: 'Aerofotografia 1928',
  variants: [
    { id: 'original', label: 'Original', file: 'historical/aero_1928_original.webp' },
    { id: 'grayscale', label: 'Tons de cinza', file: 'historical/aero_1928_grayscale.webp' },
    { id: 'contrast', label: 'Alto contraste', file: 'historical/aero_1928_contrast.webp' },
    { id: 'sepia', label: 'Sépia', file: 'historical/aero_1928_sepia.webp' },
    { id: 'ai', label: 'Ultrarrealista', file: 'historical/aero_1928_ai.webp' },
  ] as OverlayVariant[],
  defaultVariant: 'original',
  coordinates: [
    [-43.2195087680, -22.8914462977], // top-left
    [-43.1611640110, -22.8907819360], // top-right
    [-43.1607946467, -22.9181649059], // bottom-right
    [-43.2191511080, -22.9188301508], // bottom-left
  ] as [[number, number], [number, number], [number, number], [number, number]],
  defaultOpacity: 0.7,
  visible: false,
};

class ApelosMap {
  private map!: maplibregl.Map;
  private popup: maplibregl.Popup;
  private layerStates: Map<string, boolean> = new Map();
  // Per-layer appearance (fill/border/opacity), adjustable from the panel.
  private layerStyles: Map<string, LayerStyle> = new Map();
  private layerControlElement: HTMLElement | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  // Parsed GeoJSON kept in memory so data layers can be re-added after a
  // basemap swap (setStyle wipes all sources/layers).
  private geojsonCache: Map<string, FeatureCollection> = new Map();
  private currentBasemap = DEFAULT_BASEMAP;
  private labelsHidden = false;
  // 1928 overlay state, tracked so it survives basemap swaps (setStyle).
  private overlayVisible = HISTORICAL_OVERLAY.visible;
  private overlayOpacity = HISTORICAL_OVERLAY.defaultOpacity;
  private currentOverlayVariant = HISTORICAL_OVERLAY.defaultVariant;
  // 1928 overlay image adjustments (raster paint properties). Defaults are the
  // MapLibre neutrals, so the initial render is unchanged.
  private overlayBrightness = 1; // raster-brightness-max (0..1)
  private overlayContrast = 0; // raster-contrast (-1..1)
  private overlaySaturation = 0; // raster-saturation (-1..1)
  private overlayHue = 0; // raster-hue-rotate (degrees)
  // Apelos clustering ("consolidation") state. These are source-level GeoJSON
  // options, so changing them requires rebuilding the source + its layers
  // (see rebuildApelosClustering). Tracked here so they also survive basemap swaps.
  private clusteringEnabled = true;
  private clusterRadius = 50;
  private clusterMaxZoom = 16;
  // Right-side panel docking state (persisted in localStorage).
  private sidebarSide: 'right' | 'left' =
    localStorage.getItem('sidebarSide') === 'left' ? 'left' : 'right';
  private sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  constructor() {
    this.popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '400px',
    });

    // Check if MapTiler key is available
    if (!MAPTILER_KEY) {
      console.error('MapTiler API key not found! Set VITE_MAPTILER_KEY environment variable.');
      document.getElementById('info')!.innerHTML = `
        <div class="error">
          <h3>⚠️ Configuração Necessária</h3>
          <p>A chave de API do MapTiler não foi configurada.</p>
          <ol style="text-align: left; margin-top: 1rem;">
            <li>Obtenha uma chave gratuita em <a href="https://www.maptiler.com/cloud/" target="_blank">maptiler.com</a></li>
            <li>Configure a variável de ambiente <code>VITE_MAPTILER_KEY</code></li>
            <li>Reconstrua a aplicação</li>
          </ol>
        </div>
      `;
      return;
    }

    this.map = new maplibregl.Map({
      container: 'map',
      style: basemapStyle(BASEMAPS.find(b => b.id === DEFAULT_BASEMAP)!),
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
      // Required so the WebGL canvas can be read back for PNG export; without
      // it map.getCanvas().toDataURL() returns a blank image.
      preserveDrawingBuffer: true,
    });

    this.initMap();
  }

  private async initMap(): Promise<void> {
    // Add navigation controls
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Initialize layer states + default appearance
    LAYERS.forEach(layer => {
      this.layerStates.set(layer.id, layer.visible);
      this.layerStyles.set(layer.id, this.defaultLayerStyle(layer));
    });

    // Set up the dockable / collapsible right-side panel.
    this.setupSidebarDock();

    // Wait for map to load
    this.map.on('load', async () => {
      await this.loadAllLayers();
      this.setupInteractions();
      this.createLayerControl();
    });
  }

  private async loadAllLayers(): Promise<void> {
    const basePath = import.meta.env.BASE_URL || '/';

    // Fetch and cache each layer's GeoJSON once. The cache lets us re-add the
    // data layers after a basemap switch without re-fetching.
    for (const layer of LAYERS) {
      try {
        const response = await fetch(`${basePath}data/${layer.file}`);
        const data: FeatureCollection = await response.json();
        this.geojsonCache.set(layer.id, data);
        console.log(`Loaded layer: ${layer.name} (${data.features.length} features)`);
      } catch (error) {
        console.error(`Error loading layer ${layer.name}:`, error);
      }
    }

    // Add the cached data to the current style.
    this.addDataLayers();

    // Fit map to the apelos layer (the map's subject) — not every loaded layer,
    // since the city-limit polygon would expand the bounds to the whole city.
    this.fitMapToApelos();
  }

  // Adds sources + layers from the in-memory cache onto whatever style is
  // currently loaded. Safe to call again after a basemap swap.
  private addDataLayers(): void {
    // Add the historical raster first so it sits beneath the appeal points.
    this.addHistoricalOverlay();

    for (const layer of LAYERS) {
      const data = this.geojsonCache.get(layer.id);
      if (!data) continue;

      if (layer.type === 'point' && layer.id === 'apelos') {
        // Apelos with clustering
        this.map.addSource(layer.id, {
          type: 'geojson',
          data: data,
          cluster: this.clusteringEnabled,
          clusterMaxZoom: this.clusterMaxZoom,
          clusterRadius: this.clusterRadius,
        });
        this.addApelosLayers(layer);
      } else if (layer.type === 'point') {
        // Regular points (schools)
        this.map.addSource(layer.id, {
          type: 'geojson',
          data: data,
        });
        this.addPointLayer(layer);
      } else if (layer.type === 'polygon') {
        // Polygons (neighborhoods)
        this.map.addSource(layer.id, {
          type: 'geojson',
          data: data,
        });
        this.addPolygonLayer(layer);
      } else if (layer.type === 'line') {
        // Lines (streets)
        this.map.addSource(layer.id, {
          type: 'geojson',
          data: data,
        });
        this.addLineLayer(layer);
      }

      // Push any user-customized appearance onto the freshly added layers
      // (also re-applies it after a basemap swap re-runs this method).
      this.applyLayerStyle(layer.id);
    }
  }

  // Adds the 1928 aerial as an image source + raster layer. Called once on load;
  // basemap swaps carry it over via switchBasemap's transformStyle.
  private overlayVariantUrl(variantId: string): string {
    const o = HISTORICAL_OVERLAY;
    const basePath = import.meta.env.BASE_URL || '/';
    const variant = o.variants.find(v => v.id === variantId) ?? o.variants[0];
    return `${basePath}${variant.file}`;
  }

  private addHistoricalOverlay(): void {
    const o = HISTORICAL_OVERLAY;

    this.map.addSource(o.id, {
      type: 'image',
      url: this.overlayVariantUrl(this.currentOverlayVariant),
      coordinates: o.coordinates,
    });

    this.map.addLayer({
      id: `${o.id}-layer`,
      type: 'raster',
      source: o.id,
      paint: {
        'raster-opacity': this.overlayOpacity,
        'raster-fade-duration': 0,
        'raster-brightness-max': this.overlayBrightness,
        'raster-contrast': this.overlayContrast,
        'raster-saturation': this.overlaySaturation,
        'raster-hue-rotate': this.overlayHue,
      },
      layout: {
        visibility: this.overlayVisible ? 'visible' : 'none',
      },
    });
  }

  private toggleHistoricalOverlay(visible: boolean): void {
    this.overlayVisible = visible;
    const id = `${HISTORICAL_OVERLAY.id}-layer`;
    if (this.map.getLayer(id)) {
      this.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    }
  }

  private setOverlayOpacity(opacity: number): void {
    this.overlayOpacity = opacity;
    this.setOverlayPaint('raster-opacity', opacity);
  }

  // Shared helper for the 1928 raster paint adjustments (brightness/contrast/
  // saturation/hue). Each is a live MapLibre paint property.
  private setOverlayPaint(prop: string, value: number): void {
    const id = `${HISTORICAL_OVERLAY.id}-layer`;
    if (this.map.getLayer(id)) {
      this.map.setPaintProperty(id, prop, value);
    }
  }

  private setOverlayBrightness(value: number): void {
    this.overlayBrightness = value;
    this.setOverlayPaint('raster-brightness-max', value);
  }

  private setOverlayContrast(value: number): void {
    this.overlayContrast = value;
    this.setOverlayPaint('raster-contrast', value);
  }

  private setOverlaySaturation(value: number): void {
    this.overlaySaturation = value;
    this.setOverlayPaint('raster-saturation', value);
  }

  private setOverlayHue(value: number): void {
    this.overlayHue = value;
    this.setOverlayPaint('raster-hue-rotate', value);
  }

  // Swaps the 1928 overlay to another visual version. Only the image changes;
  // the source/layer, its coordinates, opacity, visibility and stacking order are
  // untouched, and the swap survives a basemap switch (transformStyle carries the
  // source with its current url).
  private switchOverlayVariant(variantId: string): void {
    if (variantId === this.currentOverlayVariant) return;
    if (!HISTORICAL_OVERLAY.variants.some(v => v.id === variantId)) return;

    this.currentOverlayVariant = variantId;
    const source = this.map.getSource(HISTORICAL_OVERLAY.id) as
      maplibregl.ImageSource | undefined;
    source?.updateImage({ url: this.overlayVariantUrl(variantId) });
    this.updateOverlayVariantButtons();
  }

  private updateOverlayVariantButtons(): void {
    if (!this.layerControlElement) return;
    this.layerControlElement
      .querySelectorAll('.overlay-variant-btn')
      .forEach(btn => {
        const el = btn as HTMLElement;
        el.classList.toggle('active', el.dataset.variantId === this.currentOverlayVariant);
      });
  }

  // Switches the basemap background. setStyle replaces the whole style; the
  // `transformStyle` callback atomically carries our data sources + layers (with
  // their current visibility/paint) into the new basemap, so nothing has to be
  // re-fetched or re-added and there's no flicker. Camera is preserved, and
  // layer-scoped event listeners survive because layer ids are unchanged. This
  // avoids relying on the `style.load` event, which is unreliable for re-adding
  // layers after setStyle in maplibre-gl v4.
  private switchBasemap(id: string): void {
    if (id === this.currentBasemap) return;
    const bm = BASEMAPS.find(b => b.id === id);
    if (!bm) return;

    this.currentBasemap = id;
    const dataSourceIds = new Set(LAYERS.map(l => l.id));
    const overlayId = HISTORICAL_OVERLAY.id;

    this.map.setStyle(basemapStyle(bm), {
      transformStyle: (previous, next) => {
        if (!previous) return next;

        // Carry over our GeoJSON sources (they embed the data + cluster config)
        // and the 1928 image overlay source.
        const sources = { ...next.sources };
        Object.keys(previous.sources).forEach(srcId => {
          if (dataSourceIds.has(srcId) || srcId === overlayId) {
            sources[srcId] = previous.sources[srcId];
          }
        });

        // Keep the historical overlay beneath the data layers, and both on top of
        // the new basemap's layers. Carrying the previous layer objects preserves
        // their current opacity/visibility, so no re-apply is needed.
        const overlayLayers = previous.layers.filter(
          l => 'source' in l && l.source === overlayId
        );
        const dataLayers = previous.layers.filter(
          l => 'source' in l && typeof l.source === 'string' && dataSourceIds.has(l.source)
        );

        return {
          ...next,
          sources,
          layers: [...next.layers, ...overlayLayers, ...dataLayers],
        };
      },
    });

    this.updateBasemapButtons();

    // The new basemap re-introduces its own labels; re-hide them if needed once
    // the style has settled. `idle` fires reliably after the swap completes.
    if (this.labelsHidden) {
      this.map.once('idle', () => this.applyLabelVisibility(false));
    }
  }

  // Shows/hides basemap text + icon labels without touching our data layers.
  // Our data sources are excluded so e.g. the apelos cluster counts remain.
  private applyLabelVisibility(visible: boolean): void {
    const dataSourceIds = new Set(LAYERS.map(l => l.id));
    const style = this.map.getStyle();
    if (!style.layers) return;

    const value = visible ? 'visible' : 'none';
    style.layers.forEach(l => {
      if (l.type !== 'symbol') return;
      if ('source' in l && l.source && dataSourceIds.has(l.source)) return;
      if (this.map.getLayer(l.id)) {
        this.map.setLayoutProperty(l.id, 'visibility', value);
      }
    });
  }

  private toggleLabels(hidden: boolean): void {
    this.labelsHidden = hidden;
    this.applyLabelVisibility(!hidden);
  }

  private updateBasemapButtons(): void {
    if (!this.layerControlElement) return;
    this.layerControlElement
      .querySelectorAll('.basemap-btn')
      .forEach(btn => {
        const el = btn as HTMLElement;
        el.classList.toggle('active', el.dataset.basemapId === this.currentBasemap);
      });
  }

  // Downloads the current map view as a PNG. Forces a fresh render first so the
  // captured frame matches what's on screen.
  private exportPng(): void {
    this.map.once('render', () => {
      const link = document.createElement('a');
      link.download = `apelos-mapa-${Date.now()}.png`;
      link.href = this.map.getCanvas().toDataURL('image/png');
      link.click();
    });
    this.map.triggerRepaint();
  }

  private addApelosLayers(layer: LayerConfig): void {
    // Clustered circles
    this.map.addLayer({
      id: `${layer.id}-clusters`,
      type: 'circle',
      source: layer.id,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': layer.color,
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          30,
          40,
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });

    // Cluster count
    this.map.addLayer({
      id: `${layer.id}-cluster-count`,
      type: 'symbol',
      source: layer.id,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Noto Sans Bold'],
        'text-size': 12,
        visibility: layer.visible ? 'visible' : 'none',
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    // Unclustered points
    this.map.addLayer({
      id: `${layer.id}-points`,
      type: 'circle',
      source: layer.id,
      filter: ['!', ['has', 'point_count']],
      paint: {
        // Uniform brand color for every appeal point (see FEATURE_COLOR).
        'circle-color': layer.color,
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.9,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });

    // Hover effect
    this.map.addLayer({
      id: `${layer.id}-hover`,
      type: 'circle',
      source: layer.id,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'Name'], '']],
      paint: {
        // Hover halo matches the uniform feature color (see FEATURE_COLOR).
        'circle-color': layer.color,
        'circle-radius': 14,
        'circle-opacity': 0.3,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });
  }

  // Re-creates the apelos source + its 4 layers with the current clustering
  // settings. Needed because cluster/clusterRadius/clusterMaxZoom are
  // source-level options that can't be mutated after the source is created.
  // Event handlers bind by layer-ID string, so re-adding the same layer IDs
  // keeps clicks/hovers working without re-binding.
  private rebuildApelosClustering(): void {
    const layer = LAYERS.find(l => l.id === 'apelos');
    const data = this.geojsonCache.get('apelos');
    if (!layer || !data || !this.map.getSource('apelos')) return;

    // Tear down the dependent layers first, then the source.
    this.getLayerIds('apelos').forEach(id => {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    });
    this.map.removeSource('apelos');

    this.map.addSource('apelos', {
      type: 'geojson',
      data: data,
      cluster: this.clusteringEnabled,
      clusterMaxZoom: this.clusterMaxZoom,
      clusterRadius: this.clusterRadius,
    });
    this.addApelosLayers(layer);

    // Re-apply the user's current visibility choice (addApelosLayers uses the
    // static config default, which may differ from the live toggle state).
    this.toggleLayer('apelos', this.layerStates.get('apelos') ?? layer.visible);

    // The rebuilt layers carry the config-default paint; restore any custom
    // appearance the user set before the rebuild.
    this.applyLayerStyle('apelos');
  }

  // ---- Per-layer appearance (fill / border / opacity) ----------------------

  // Per-type defaults mirroring the hard-coded paint in the add*Layer methods.
  private defaultLayerStyle(layer: LayerConfig): LayerStyle {
    // The municipal limit spans the whole city, so a 0.2 fill would tint the
    // entire view — show it as a prominent outline with a barely-there fill.
    if (layer.id === 'limite-municipio') {
      return { color: layer.color, borderColor: layer.color, borderWidth: 3, opacity: 0.05 };
    }
    switch (layer.type) {
      case 'polygon':
        return { color: layer.color, borderColor: layer.color, borderWidth: 2, opacity: 0.2 };
      case 'line':
        return { color: layer.color, borderColor: layer.color, borderWidth: 1, opacity: 0.6 };
      case 'point':
      default:
        return { color: layer.color, borderColor: '#ffffff', borderWidth: 2, opacity: 0.9 };
    }
  }

  // Maps a layer to the [layerId, paintProperty] tuples each control group drives.
  private paintTargets(layerId: string): {
    fill: [string, string][];
    border: [string, string][];
    width: [string, string][];
    opacity: [string, string][];
  } {
    const layer = LAYERS.find(l => l.id === layerId);
    const empty = { fill: [], border: [], width: [], opacity: [] };
    if (!layer) return empty;

    if (layer.type === 'point') {
      const circles = layer.id === 'apelos'
        ? [`${layerId}-clusters`, `${layerId}-points`]
        : [`${layerId}-points`];
      const fillCircles = layer.id === 'apelos'
        ? [`${layerId}-clusters`, `${layerId}-points`, `${layerId}-hover`]
        : [`${layerId}-points`];
      return {
        fill: fillCircles.map(id => [id, 'circle-color']),
        border: circles.map(id => [id, 'circle-stroke-color']),
        width: circles.map(id => [id, 'circle-stroke-width']),
        opacity: circles.map(id => [id, 'circle-opacity']),
      };
    }
    if (layer.type === 'polygon') {
      return {
        fill: [[`${layerId}-fill`, 'fill-color']],
        border: [[`${layerId}-outline`, 'line-color']],
        width: [[`${layerId}-outline`, 'line-width']],
        opacity: [[`${layerId}-fill`, 'fill-opacity']],
      };
    }
    // line
    return {
      fill: [[`${layerId}-line`, 'line-color']],
      border: [],
      width: [[`${layerId}-line`, 'line-width']],
      opacity: [[`${layerId}-line`, 'line-opacity']],
    };
  }

  private setPaint(targets: [string, string][], value: string | number): void {
    targets.forEach(([id, prop]) => {
      if (this.map.getLayer(id)) this.map.setPaintProperty(id, prop, value);
    });
  }

  // Pushes the stored appearance for a layer onto its paint properties. Safe to
  // call right after (re)creating the layers.
  private applyLayerStyle(layerId: string): void {
    const style = this.layerStyles.get(layerId);
    if (!style) return;
    const t = this.paintTargets(layerId);
    this.setPaint(t.fill, style.color);
    this.setPaint(t.border, style.borderColor);
    this.setPaint(t.width, style.borderWidth);
    this.setPaint(t.opacity, style.opacity);
  }

  private setLayerColor(layerId: string, color: string): void {
    const style = this.layerStyles.get(layerId);
    if (!style) return;
    style.color = color;
    this.setPaint(this.paintTargets(layerId).fill, color);
    // Keep the legend swatch in sync.
    const swatch = this.layerControlElement
      ?.querySelector(`.layer-row[data-layer-id="${layerId}"] .layer-color`) as HTMLElement | null;
    if (swatch) swatch.style.backgroundColor = color;
  }

  private setLayerBorderColor(layerId: string, color: string): void {
    const style = this.layerStyles.get(layerId);
    if (!style) return;
    style.borderColor = color;
    this.setPaint(this.paintTargets(layerId).border, color);
  }

  private setLayerBorderWidth(layerId: string, width: number): void {
    const style = this.layerStyles.get(layerId);
    if (!style) return;
    style.borderWidth = width;
    this.setPaint(this.paintTargets(layerId).width, width);
  }

  private setLayerOpacity(layerId: string, opacity: number): void {
    const style = this.layerStyles.get(layerId);
    if (!style) return;
    style.opacity = opacity;
    this.setPaint(this.paintTargets(layerId).opacity, opacity);
  }

  // Restores a layer to its config-default appearance and syncs the row's inputs.
  private resetLayerStyle(layerId: string): void {
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer) return;
    const def = this.defaultLayerStyle(layer);
    this.layerStyles.set(layerId, { ...def });
    this.applyLayerStyle(layerId);

    const row = this.layerControlElement
      ?.querySelector(`.layer-row[data-layer-id="${layerId}"]`) as HTMLElement | null;
    if (!row) return;
    (row.querySelector('.ls-color') as HTMLInputElement).value = def.color;
    (row.querySelector('.ls-border-color') as HTMLInputElement).value = def.borderColor;
    const widthInput = row.querySelector('.ls-width') as HTMLInputElement;
    widthInput.value = String(def.borderWidth);
    (row.querySelector('.ls-width-val') as HTMLElement).textContent = String(def.borderWidth);
    const opacityInput = row.querySelector('.ls-opacity') as HTMLInputElement;
    opacityInput.value = String(Math.round(def.opacity * 100));
    (row.querySelector('.ls-opacity-val') as HTMLElement).textContent =
      `${Math.round(def.opacity * 100)}%`;
    const swatch = row.querySelector('.layer-color') as HTMLElement | null;
    if (swatch) swatch.style.backgroundColor = def.color;
  }

  private addPointLayer(layer: LayerConfig): void {
    this.map.addLayer({
      id: `${layer.id}-points`,
      type: 'circle',
      source: layer.id,
      paint: {
        'circle-color': layer.color,
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.8,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });
  }

  private addPolygonLayer(layer: LayerConfig): void {
    // Fill
    this.map.addLayer({
      id: `${layer.id}-fill`,
      type: 'fill',
      source: layer.id,
      paint: {
        'fill-color': layer.color,
        'fill-opacity': 0.2,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });

    // Outline
    this.map.addLayer({
      id: `${layer.id}-outline`,
      type: 'line',
      source: layer.id,
      paint: {
        'line-color': layer.color,
        'line-width': 2,
        'line-opacity': 0.8,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });
  }

  private addLineLayer(layer: LayerConfig): void {
    this.map.addLayer({
      id: `${layer.id}-line`,
      type: 'line',
      source: layer.id,
      paint: {
        'line-color': layer.color,
        'line-width': 1,
        'line-opacity': 0.6,
      },
      layout: {
        visibility: layer.visible ? 'visible' : 'none',
      },
    });
  }

  // Wires up the collapsible + side-dockable right panel: an edge handle that
  // slides the panel open/closed and a header button that moves it to the other
  // side. State is persisted and the MapLibre canvas is kept filled during the
  // (CSS-driven) animation.
  private setupSidebarDock(): void {
    const app = document.getElementById('app');
    const header = document.querySelector('.sidebar-header');
    if (!app || !header) return;

    const chevron = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
           stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    // Edge handle → collapse / expand.
    const handle = document.createElement('button');
    handle.className = 'dock-handle';
    handle.setAttribute('aria-label', 'Recolher ou expandir o painel');
    handle.title = 'Recolher / expandir painel';
    handle.innerHTML = chevron;
    handle.addEventListener('click', () => {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
      this.applySidebarState();
      this.animateMapResize();
    });
    app.appendChild(handle);

    // Header button → switch dock side (left / right).
    const sideBtn = document.createElement('button');
    sideBtn.className = 'dock-side-btn';
    sideBtn.setAttribute('aria-label', 'Mover o painel para o outro lado');
    sideBtn.title = 'Mover painel para o outro lado';
    sideBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <polyline points="17 11 21 7 17 3"></polyline>
        <line x1="21" y1="7" x2="9" y2="7"></line>
        <polyline points="7 21 3 17 7 13"></polyline>
        <line x1="3" y1="17" x2="15" y2="17"></line>
      </svg>`;
    sideBtn.addEventListener('click', () => {
      this.sidebarSide = this.sidebarSide === 'right' ? 'left' : 'right';
      localStorage.setItem('sidebarSide', this.sidebarSide);
      this.applySidebarState();
      this.animateMapResize();
    });
    header.appendChild(sideBtn);

    this.applySidebarState();
    // Restored state may differ from the map's initial container size.
    requestAnimationFrame(() => this.map.resize());
  }

  private applySidebarState(): void {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.toggle('dock-left', this.sidebarSide === 'left');
    app.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
  }

  // Keeps the WebGL canvas filling its (animating) container by resizing across
  // the CSS transition, then once more after it settles.
  private animateMapResize(durationMs = 380): void {
    const start = performance.now();
    const tick = (now: number): void => {
      this.map.resize();
      if (now - start < durationMs) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private createLayerControl(): void {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'layer-control';
    controlDiv.innerHTML = `
      <div class="layer-control-header">
        <h3>Camadas do Mapa</h3>
        <button class="layer-control-toggle" aria-label="Toggle layer control">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path fill="currentColor" d="M5 8l5 5 5-5z"/>
          </svg>
        </button>
      </div>
      <div class="layer-control-content">
        <div class="layer-group">
          ${LAYERS.map(layer => {
            const s = this.layerStyles.get(layer.id) ?? this.defaultLayerStyle(layer);
            const opacityPct = Math.round(s.opacity * 100);
            return `
            <div class="layer-row" data-layer-id="${layer.id}">
              <label class="layer-item">
                <input type="checkbox"
                       data-layer-id="${layer.id}"
                       ${layer.visible ? 'checked' : ''}>
                <span class="layer-color" style="background-color: ${s.color}"></span>
                <span class="layer-name">${layer.name}</span>
              </label>
              <button class="layer-style-toggle" data-layer-id="${layer.id}"
                      aria-label="Ajustar estilo" title="Ajustar estilo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <div class="layer-style-panel" data-layer-id="${layer.id}">
                <div class="opacity-control cluster-control">
                  <label>Opacidade <span class="ls-opacity-val">${opacityPct}%</span></label>
                  <input type="range" class="opacity-slider ls-opacity"
                         min="0" max="100" value="${opacityPct}">
                </div>
                <div class="ls-color-row">
                  <label class="ls-color-field">Cor
                    <input type="color" class="ls-color" value="${s.color}"></label>
                  <label class="ls-color-field">Borda
                    <input type="color" class="ls-border-color" value="${s.borderColor}"></label>
                </div>
                <div class="opacity-control cluster-control">
                  <label>Espessura da borda <span class="ls-width-val">${s.borderWidth}</span></label>
                  <input type="range" class="opacity-slider ls-width"
                         min="0" max="8" step="0.5" value="${s.borderWidth}">
                </div>
                <button class="ls-reset" data-layer-id="${layer.id}">Restaurar padrão</button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
        <div class="overlay-section">
          <div class="overlay-header-row">
            <label class="layer-item">
              <input type="checkbox" id="overlay-toggle" ${HISTORICAL_OVERLAY.visible ? 'checked' : ''}>
              <span class="layer-name">${HISTORICAL_OVERLAY.label}</span>
            </label>
            <button class="layer-style-toggle" id="overlay-style-toggle"
                    aria-label="Ajustar imagem" title="Ajustar imagem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round"
                   stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
          <div class="layer-style-panel" id="overlay-style-panel">
            <div class="opacity-control cluster-control">
              <label for="overlay-opacity">Opacidade <span id="overlay-opacity-val">${Math.round(HISTORICAL_OVERLAY.defaultOpacity * 100)}%</span></label>
              <input type="range" id="overlay-opacity" class="opacity-slider"
                     min="0" max="100" value="${Math.round(HISTORICAL_OVERLAY.defaultOpacity * 100)}">
            </div>
            <div class="overlay-variants">
              ${HISTORICAL_OVERLAY.variants.map(v => `
                <button class="overlay-variant-btn ${v.id === this.currentOverlayVariant ? 'active' : ''}"
                        data-variant-id="${v.id}"
                        title="${v.label}">${v.label}</button>
              `).join('')}
            </div>
            <div class="opacity-control cluster-control">
              <label for="overlay-brightness">Brilho <span id="overlay-brightness-val">${Math.round(this.overlayBrightness * 100)}%</span></label>
              <input type="range" id="overlay-brightness" class="opacity-slider"
                     min="0" max="100" value="${Math.round(this.overlayBrightness * 100)}">
            </div>
            <div class="opacity-control cluster-control">
              <label for="overlay-contrast">Contraste <span id="overlay-contrast-val">${Math.round(this.overlayContrast * 100)}</span></label>
              <input type="range" id="overlay-contrast" class="opacity-slider"
                     min="-100" max="100" value="${Math.round(this.overlayContrast * 100)}">
            </div>
            <div class="opacity-control cluster-control">
              <label for="overlay-saturation">Saturação <span id="overlay-saturation-val">${Math.round(this.overlaySaturation * 100)}</span></label>
              <input type="range" id="overlay-saturation" class="opacity-slider"
                     min="-100" max="100" value="${Math.round(this.overlaySaturation * 100)}">
            </div>
            <div class="opacity-control cluster-control">
              <label for="overlay-hue">Matiz <span id="overlay-hue-val">${Math.round(this.overlayHue)}°</span></label>
              <input type="range" id="overlay-hue" class="opacity-slider"
                     min="0" max="360" value="${Math.round(this.overlayHue)}">
            </div>
          </div>
        </div>
        <div class="cluster-section">
          <label class="layer-item">
            <input type="checkbox" id="cluster-toggle" ${this.clusteringEnabled ? 'checked' : ''}>
            <span class="layer-name">Agrupar apelos próximos</span>
          </label>
          <div class="opacity-control cluster-control">
            <label for="cluster-radius">Raio de agrupamento <span id="cluster-radius-value">${this.clusterRadius}</span></label>
            <input type="range" id="cluster-radius" class="opacity-slider"
                   min="0" max="100" value="${this.clusterRadius}" ${this.clusteringEnabled ? '' : 'disabled'}>
          </div>
          <div class="opacity-control cluster-control">
            <label for="cluster-maxzoom">Zoom máximo de agrupamento <span id="cluster-maxzoom-value">${this.clusterMaxZoom}</span></label>
            <input type="range" id="cluster-maxzoom" class="opacity-slider"
                   min="0" max="18" value="${this.clusterMaxZoom}" ${this.clusteringEnabled ? '' : 'disabled'}>
          </div>
        </div>
        <div class="basemap-section">
          <span class="basemap-section-title">Mapa base</span>
          <div class="basemap-grid">
            ${BASEMAPS.map(bm => `
              <button class="basemap-btn ${bm.id === this.currentBasemap ? 'active' : ''}"
                      data-basemap-id="${bm.id}"
                      title="${bm.label}">${bm.label}</button>
            `).join('')}
          </div>
          <label class="layer-item labels-toggle">
            <input type="checkbox" id="hide-labels-checkbox">
            <span class="layer-name">Ocultar rótulos</span>
          </label>
        </div>
        <div class="layer-control-actions">
          <button id="fit-to-features-btn" class="fit-to-features-btn" title="Ajustar zoom para mostrar os apelos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Ajustar Zoom
          </button>
          <button id="export-png-btn" class="fit-to-features-btn export-png-btn" title="Exportar a vista atual como imagem PNG">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar PNG
          </button>
        </div>
      </div>
    `;

    document.getElementById('map')!.appendChild(controlDiv);
    this.layerControlElement = controlDiv;

    // Make the control draggable
    this.makeDraggable(controlDiv);

    // Toggle control visibility
    const toggleBtn = controlDiv.querySelector('.layer-control-toggle') as HTMLButtonElement;
    
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = controlDiv.classList.toggle('collapsed');
      toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
    });

    // Layer toggle handlers (scoped to data layers; the overlay/labels
    // checkboxes have their own handlers below).
    const checkboxes = controlDiv.querySelectorAll('input[type="checkbox"][data-layer-id]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const layerId = target.dataset.layerId!;
        this.toggleLayer(layerId, target.checked);
      });
    });

    // Per-layer appearance controls (opacity / fill color / border / reset).
    controlDiv.querySelectorAll('.layer-row').forEach(rowEl => {
      const row = rowEl as HTMLElement;
      const layerId = row.dataset.layerId!;

      // Expand / collapse the style sub-panel.
      const styleToggle = row.querySelector('.layer-style-toggle') as HTMLButtonElement;
      const panel = row.querySelector('.layer-style-panel') as HTMLElement;
      styleToggle.addEventListener('click', () => {
        const open = panel.classList.toggle('expanded');
        styleToggle.classList.toggle('active', open);
      });

      // Opacity (live label + paint update).
      const opacity = row.querySelector('.ls-opacity') as HTMLInputElement;
      const opacityVal = row.querySelector('.ls-opacity-val') as HTMLElement;
      opacity.addEventListener('input', (e) => {
        const pct = Number((e.target as HTMLInputElement).value);
        opacityVal.textContent = `${pct}%`;
        this.setLayerOpacity(layerId, pct / 100);
      });

      // Fill + border color.
      (row.querySelector('.ls-color') as HTMLInputElement).addEventListener('input', (e) => {
        this.setLayerColor(layerId, (e.target as HTMLInputElement).value);
      });
      (row.querySelector('.ls-border-color') as HTMLInputElement).addEventListener('input', (e) => {
        this.setLayerBorderColor(layerId, (e.target as HTMLInputElement).value);
      });

      // Border width (live label + paint update).
      const width = row.querySelector('.ls-width') as HTMLInputElement;
      const widthVal = row.querySelector('.ls-width-val') as HTMLElement;
      width.addEventListener('input', (e) => {
        const w = Number((e.target as HTMLInputElement).value);
        widthVal.textContent = String(w);
        this.setLayerBorderWidth(layerId, w);
      });

      // Reset to config defaults.
      (row.querySelector('.ls-reset') as HTMLButtonElement).addEventListener('click', () => {
        this.resetLayerStyle(layerId);
      });
    });

    // Historical overlay (1928) toggle + opacity handlers
    const overlayToggle = controlDiv.querySelector('#overlay-toggle') as HTMLInputElement;
    overlayToggle.addEventListener('change', (e) => {
      this.toggleHistoricalOverlay((e.target as HTMLInputElement).checked);
    });

    // Expand / collapse the overlay's image-adjustment panel (gear).
    const overlayStyleToggle = controlDiv.querySelector('#overlay-style-toggle') as HTMLButtonElement;
    const overlayStylePanel = controlDiv.querySelector('#overlay-style-panel') as HTMLElement;
    overlayStyleToggle.addEventListener('click', () => {
      const open = overlayStylePanel.classList.toggle('expanded');
      overlayStyleToggle.classList.toggle('active', open);
    });

    const overlayOpacity = controlDiv.querySelector('#overlay-opacity') as HTMLInputElement;
    const overlayOpacityVal = controlDiv.querySelector('#overlay-opacity-val') as HTMLElement;
    overlayOpacity.addEventListener('input', (e) => {
      const pct = Number((e.target as HTMLInputElement).value);
      overlayOpacityVal.textContent = `${pct}%`;
      this.setOverlayOpacity(pct / 100);
    });

    // Overlay version switcher handlers
    const variantBtns = controlDiv.querySelectorAll('.overlay-variant-btn');
    variantBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = (e.currentTarget as HTMLElement).dataset.variantId;
        if (variantId) this.switchOverlayVariant(variantId);
      });
    });

    // Overlay image adjustments (brightness / contrast / saturation / hue).
    const overlayBrightness = controlDiv.querySelector('#overlay-brightness') as HTMLInputElement;
    const overlayBrightnessVal = controlDiv.querySelector('#overlay-brightness-val') as HTMLElement;
    overlayBrightness.addEventListener('input', (e) => {
      const pct = Number((e.target as HTMLInputElement).value);
      overlayBrightnessVal.textContent = `${pct}%`;
      this.setOverlayBrightness(pct / 100);
    });

    const overlayContrast = controlDiv.querySelector('#overlay-contrast') as HTMLInputElement;
    const overlayContrastVal = controlDiv.querySelector('#overlay-contrast-val') as HTMLElement;
    overlayContrast.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      overlayContrastVal.textContent = String(v);
      this.setOverlayContrast(v / 100);
    });

    const overlaySaturation = controlDiv.querySelector('#overlay-saturation') as HTMLInputElement;
    const overlaySaturationVal = controlDiv.querySelector('#overlay-saturation-val') as HTMLElement;
    overlaySaturation.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      overlaySaturationVal.textContent = String(v);
      this.setOverlaySaturation(v / 100);
    });

    const overlayHue = controlDiv.querySelector('#overlay-hue') as HTMLInputElement;
    const overlayHueVal = controlDiv.querySelector('#overlay-hue-val') as HTMLElement;
    overlayHue.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      overlayHueVal.textContent = `${v}°`;
      this.setOverlayHue(v);
    });

    // Apelos clustering ("consolidation") controls.
    const clusterToggle = controlDiv.querySelector('#cluster-toggle') as HTMLInputElement;
    const clusterRadius = controlDiv.querySelector('#cluster-radius') as HTMLInputElement;
    const clusterMaxZoom = controlDiv.querySelector('#cluster-maxzoom') as HTMLInputElement;
    const clusterRadiusValue = controlDiv.querySelector('#cluster-radius-value') as HTMLElement;
    const clusterMaxZoomValue = controlDiv.querySelector('#cluster-maxzoom-value') as HTMLElement;

    clusterToggle.addEventListener('change', (e) => {
      this.clusteringEnabled = (e.target as HTMLInputElement).checked;
      clusterRadius.disabled = !this.clusteringEnabled;
      clusterMaxZoom.disabled = !this.clusteringEnabled;
      this.rebuildApelosClustering();
    });

    // Update the live value label while dragging (cheap); only rebuild the
    // source + layers on release ('change') to avoid thrashing on every pixel.
    clusterRadius.addEventListener('input', (e) => {
      clusterRadiusValue.textContent = (e.target as HTMLInputElement).value;
    });
    clusterRadius.addEventListener('change', (e) => {
      this.clusterRadius = Number((e.target as HTMLInputElement).value);
      this.rebuildApelosClustering();
    });

    clusterMaxZoom.addEventListener('input', (e) => {
      clusterMaxZoomValue.textContent = (e.target as HTMLInputElement).value;
    });
    clusterMaxZoom.addEventListener('change', (e) => {
      this.clusterMaxZoom = Number((e.target as HTMLInputElement).value);
      this.rebuildApelosClustering();
    });

    // Fit to features button handler
    const fitToFeaturesBtn = controlDiv.querySelector('#fit-to-features-btn') as HTMLButtonElement;
    fitToFeaturesBtn.addEventListener('click', () => {
      this.fitMapToApelos();
    });

    // Basemap switcher handlers
    const basemapBtns = controlDiv.querySelectorAll('.basemap-btn');
    basemapBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.basemapId;
        if (id) this.switchBasemap(id);
      });
    });

    // Hide-labels toggle handler
    const hideLabelsCheckbox = controlDiv.querySelector('#hide-labels-checkbox') as HTMLInputElement;
    hideLabelsCheckbox.addEventListener('change', (e) => {
      this.toggleLabels((e.target as HTMLInputElement).checked);
    });

    // Export PNG button handler
    const exportPngBtn = controlDiv.querySelector('#export-png-btn') as HTMLButtonElement;
    exportPngBtn.addEventListener('click', () => {
      this.exportPng();
    });
  }

  private toggleLayer(layerId: string, visible: boolean): void {
    this.layerStates.set(layerId, visible);
    const visibility = visible ? 'visible' : 'none';

    // Get all layer IDs for this data layer
    const layerIds = this.getLayerIds(layerId);
    
    layerIds.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', visibility);
      }
    });
  }

  private getLayerIds(baseId: string): string[] {
    const layer = LAYERS.find(l => l.id === baseId);
    if (!layer) return [];

    if (layer.id === 'apelos') {
      return [`${baseId}-clusters`, `${baseId}-cluster-count`, `${baseId}-points`, `${baseId}-hover`];
    } else if (layer.type === 'point') {
      return [`${baseId}-points`];
    } else if (layer.type === 'polygon') {
      return [`${baseId}-fill`, `${baseId}-outline`];
    } else if (layer.type === 'line') {
      return [`${baseId}-line`];
    }
    return [];
  }

  // True when the map container is in (real) fullscreen. Checks the WebKit-
  // prefixed property too, for Safari / iPadOS.
  private isMapFullscreen(): boolean {
    const fsEl = document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element })
        .webkitFullscreenElement;
    return !!fsEl && (fsEl === this.map.getContainer() ||
      this.map.getContainer().contains(fsEl));
  }

  private setupInteractions(): void {
    // The popup only belongs in fullscreen; remove any leftover one on exit.
    const onFsChange = (): void => {
      if (!this.isMapFullscreen()) this.popup.remove();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    // Click on cluster to zoom
    this.map.on('click', 'apelos-clusters', async (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['apelos-clusters'],
      });

      if (features.length === 0) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = this.map.getSource('apelos') as maplibregl.GeoJSONSource;

      if (features[0].geometry?.type !== 'Point') return;

      try {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        this.map.easeTo({
          center: features[0].geometry.coordinates as [number, number],
          zoom: zoom || 14,
          duration: 500,
        });
      } catch (err) {
        console.error('Error expanding cluster:', err);
      }
    });

    // Show popup on point click (Apelos)
    this.map.on('click', 'apelos-points', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;

      if (!props || feature.geometry?.type !== 'Point') return;

      const coordinates = feature.geometry.coordinates.slice() as [number, number];

      // The on-map popup is only needed in fullscreen, where the side panel with
      // the details isn't visible. Outside fullscreen, the sidebar shows them.
      if (this.isMapFullscreen()) {
        const html = this.createPopupContent(props);
        this.popup.setLngLat(coordinates).setHTML(html).addTo(this.map);
      }
      this.updateSidebar(props);
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'apelos-clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'apelos-clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', 'apelos-points', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      
      if (e.features && e.features.length > 0) {
        const name = e.features[0].properties?.Name || '';
        this.map.setFilter('apelos-hover', [
          'all',
          ['!', ['has', 'point_count']],
          ['==', ['get', 'Name'], name],
        ]);
      }
    });

    this.map.on('mouseleave', 'apelos-points', () => {
      this.map.getCanvas().style.cursor = '';
      this.map.setFilter('apelos-hover', [
        'all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'Name'], ''],
      ]);
    });
    
  }

  private createPopupContent(props: Record<string, unknown>): string {
    const name = props.Name || 'Sem informação';
    const description = props.Description || 'Descrição não disponível';
    const link = props.Link;

    return `
      <div class="popup-content">
        <h3>${name}</h3>
        <p>${description}</p>
        ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="popup-link">Ver documento →</a>` : ''}
      </div>
    `;
  }

  private updateSidebar(props: Record<string, unknown>): void {
    const infoPanel = document.getElementById('info');
    if (!infoPanel) return;

    const name = props.Name || 'Sem informação';
    const description = props.Description || 'Descrição não disponível';
    const link = props.Link;

    infoPanel.innerHTML = `
      <h3>${name}</h3>
      <div class="info-description">${description}</div>
      ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="info-link">Acessar documento original →</a>` : ''}
    `;
  }

  private fitMapToFeatures(features: any[]): void {
    if (features.length === 0) return;

    // Calculate bounding box from all features
    const bounds = this.calculateBoundingBox(features);
    
    if (bounds) {
      // Fit the map to the calculated bounds with some padding
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000, // Smooth animation
        maxZoom: 15, // Don't zoom too close
      });
    }
  }

  private calculateBoundingBox(features: any[]): maplibregl.LngLatBounds | null {
    if (features.length === 0) return null;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    features.forEach(feature => {
      if (!feature.geometry) return;

      const coordinates = this.extractCoordinates(feature.geometry);
      coordinates.forEach(coord => {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
    });

    // Check if we have valid bounds
    if (minLng === Infinity || maxLng === -Infinity || minLat === Infinity || maxLat === -Infinity) {
      return null;
    }

    return new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  }

  private extractCoordinates(geometry: any): number[][] {
    const coordinates: number[][] = [];

    switch (geometry.type) {
      case 'Point':
        coordinates.push(geometry.coordinates);
        break;
      case 'LineString':
      case 'MultiPoint':
        coordinates.push(...geometry.coordinates);
        break;
      case 'Polygon':
      case 'MultiLineString':
        geometry.coordinates.forEach((ring: number[][]) => {
          coordinates.push(...ring);
        });
        break;
      case 'MultiPolygon':
        geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => {
            coordinates.push(...ring);
          });
        });
        break;
    }

    return coordinates;
  }

  // "Ajustar Zoom" fits the view to the apelos layer only — the appeals are the
  // subject of the map. Other layers (filtered bairros, and especially the
  // whole-municipality city limit) would otherwise blow the bounds out to the
  // entire city. Uses the cached GeoJSON so it works regardless of clustering.
  private fitMapToApelos(): void {
    const data = this.geojsonCache.get('apelos');
    if (data && data.features.length > 0) {
      this.fitMapToFeatures(data.features);
    } else {
      console.warn('No apelos features found to fit map to');
    }
  }

  private makeDraggable(element: HTMLElement): void {
    const header = element.querySelector('.layer-control-header') as HTMLElement;
    if (!header) return;

    // Add cursor style to indicate draggability
    header.style.cursor = 'move';
    header.style.userSelect = 'none';

    // Mouse events
    header.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Touch events for mobile
    header.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
    document.addEventListener('touchend', () => this.endDrag());
  }

  private startDrag(e: MouseEvent | TouchEvent): void {
    if (!this.layerControlElement) return;

    // Don't treat a press on the collapse button (or other interactive control)
    // as the start of a drag. On iPadOS/iOS Safari, startDrag calls
    // preventDefault() on touchstart, which suppresses the button's synthetic
    // click — so without this guard the collapse toggle never fires on touch.
    const target = e.target as HTMLElement | null;
    if (target?.closest('.layer-control-toggle, button, input, a, label')) {
      return;
    }

    this.isDragging = true;
    const rect = this.layerControlElement.getBoundingClientRect();
    
    let clientX: number;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
    } else {
      clientX = e.touches[0].clientX;
    }

    this.dragOffset.x = clientX - rect.left;
    this.dragOffset.y = (e instanceof MouseEvent ? e.clientY : e.touches[0].clientY) - rect.top;

    // Prevent default to avoid text selection
    e.preventDefault();
    
    // Add dragging class for visual feedback
    this.layerControlElement.classList.add('dragging');
  }

  private drag(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.layerControlElement) return;

    let clientX: number;
    let clientY: number;
    
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on mobile
    }

    const mapContainer = this.map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Calculate new position
    let newLeft = clientX - this.dragOffset.x;
    let newTop = clientY - this.dragOffset.y;

    // Constrain to map bounds
    const controlRect = this.layerControlElement.getBoundingClientRect();
    const maxLeft = mapRect.width - controlRect.width;
    const maxTop = mapRect.height - controlRect.height;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    // Update position
    this.layerControlElement.style.left = `${newLeft}px`;
    this.layerControlElement.style.top = `${newTop}px`;
    this.layerControlElement.style.right = 'auto';
  }

  private endDrag(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    if (this.layerControlElement) {
      this.layerControlElement.classList.remove('dragging');
    }
  }

}

// Initialize the map
new ApelosMap();

