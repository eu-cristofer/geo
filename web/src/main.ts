// Import MapLibre GL JS for interactive web mapping
import maplibregl from 'maplibre-gl';

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

// Builds a MapTiler style URL for a given map id, using the shared API key.
const basemapStyleUrl = (mapId: string): string =>
  `https://api.maptiler.com/maps/${mapId}/style.json?key=${MAPTILER_KEY}`;

// Curated set of professional basemap backgrounds for the switcher. Labels stay
// in Portuguese per the project's bilingual convention. The `mapId` is the
// MapTiler style slug. If a slug is unavailable on the account's plan it can be
// removed without further changes.
interface Basemap {
  id: string;
  label: string;
  mapId: string;
}

const BASEMAPS: Basemap[] = [
  { id: 'streets', label: 'Ruas', mapId: 'streets-v2' }, // current default
  { id: 'light', label: 'Claro', mapId: 'dataviz' }, // clean, data-overlay friendly
  { id: 'dark', label: 'Escuro', mapId: 'dataviz-dark' },
  { id: 'satellite', label: 'Satélite', mapId: 'hybrid' }, // imagery + labels
  { id: 'topo', label: 'Topo', mapId: 'topo-v2' },
  { id: 'toner', label: 'P&B', mapId: 'toner-v2' }, // high-contrast, print
];

const DEFAULT_BASEMAP = 'streets';

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
];

class ApelosMap {
  private map!: maplibregl.Map;
  private popup: maplibregl.Popup;
  private layerStates: Map<string, boolean> = new Map();
  private layerControlElement: HTMLElement | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  // Parsed GeoJSON kept in memory so data layers can be re-added after a
  // basemap swap (setStyle wipes all sources/layers).
  private geojsonCache: Map<string, FeatureCollection> = new Map();
  private currentBasemap = DEFAULT_BASEMAP;
  private labelsHidden = false;

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
      style: basemapStyleUrl(BASEMAPS.find(b => b.id === DEFAULT_BASEMAP)!.mapId),
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

    // Initialize layer states
    LAYERS.forEach(layer => {
      this.layerStates.set(layer.id, layer.visible);
    });

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

    // Fit map to all loaded features.
    const allFeatures: any[] = [];
    this.geojsonCache.forEach(data => allFeatures.push(...data.features));
    if (allFeatures.length > 0) {
      this.fitMapToFeatures(allFeatures);
    }
  }

  // Adds sources + layers from the in-memory cache onto whatever style is
  // currently loaded. Safe to call again after a basemap swap.
  private addDataLayers(): void {
    for (const layer of LAYERS) {
      const data = this.geojsonCache.get(layer.id);
      if (!data) continue;

      if (layer.type === 'point' && layer.id === 'apelos') {
        // Apelos with clustering
        this.map.addSource(layer.id, {
          type: 'geojson',
          data: data,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50,
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
    }
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

    this.map.setStyle(basemapStyleUrl(bm.mapId), {
      transformStyle: (previous, next) => {
        if (!previous) return next;

        // Carry over our GeoJSON sources (they embed the data + cluster config).
        const sources = { ...next.sources };
        Object.keys(previous.sources).forEach(srcId => {
          if (dataSourceIds.has(srcId)) sources[srcId] = previous.sources[srcId];
        });

        // Keep our data layers on top of the new basemap's layers.
        const dataLayers = previous.layers.filter(
          l => 'source' in l && typeof l.source === 'string' && dataSourceIds.has(l.source)
        );

        return { ...next, sources, layers: [...next.layers, ...dataLayers] };
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
          ${LAYERS.map(layer => `
            <label class="layer-item">
              <input type="checkbox" 
                     data-layer-id="${layer.id}" 
                     ${layer.visible ? 'checked' : ''}>
              <span class="layer-color" style="background-color: ${layer.color}"></span>
              <span class="layer-name">${layer.name}</span>
            </label>
          `).join('')}
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
          <button id="fit-to-features-btn" class="fit-to-features-btn" title="Ajustar zoom para mostrar todos os dados">
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

    // Layer toggle handlers
    const checkboxes = controlDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const layerId = target.dataset.layerId!;
        this.toggleLayer(layerId, target.checked);
      });
    });

    // Fit to features button handler
    const fitToFeaturesBtn = controlDiv.querySelector('#fit-to-features-btn') as HTMLButtonElement;
    fitToFeaturesBtn.addEventListener('click', () => {
      this.fitMapToAllLoadedFeatures();
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

  private setupInteractions(): void {
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
      const html = this.createPopupContent(props);

      this.popup.setLngLat(coordinates).setHTML(html).addTo(this.map);
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

  private fitMapToAllLoadedFeatures(): void {
    const allFeatures: any[] = [];

    // Collect all features from loaded sources
    LAYERS.forEach(layer => {
      const source = this.map.getSource(layer.id) as maplibregl.GeoJSONSource;
      if (source && source._data) {
        const data = source._data as FeatureCollection;
        if (data && data.features) {
          allFeatures.push(...data.features);
        }
      }
    });

    if (allFeatures.length > 0) {
      this.fitMapToFeatures(allFeatures);
    } else {
      console.warn('No features found to fit map to');
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

