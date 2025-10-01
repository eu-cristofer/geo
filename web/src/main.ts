import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import type { FeatureCollection } from 'geojson';

// MapTiler API key - Get your free key at https://www.maptiler.com/cloud/
// For production, use environment variables
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'get_your_own_OpIi9ZULNHzrESv6T2N4';

// Map configuration
const MAP_CONFIG = {
  center: [-43.1895, -22.9068] as [number, number], // Rio de Janeiro center
  zoom: 13,
  pitch: 0,
  bearing: 0,
};

class ApelosMap {
  private map: maplibregl.Map;
  private popup: maplibregl.Popup;

  constructor() {
    this.popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '400px',
    });

    this.map = new maplibregl.Map({
      container: 'map',
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
    });

    this.initMap();
  }

  private async initMap(): Promise<void> {
    // Add navigation controls
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Wait for map to load
    this.map.on('load', async () => {
      await this.loadData();
      this.setupInteractions();
    });
  }

  private async loadData(): Promise<void> {
    try {
      // Load GeoJSON data
      const response = await fetch('/data/apelos_clean.geojson');
      const data: FeatureCollection = await response.json();

      // Add source
      this.map.addSource('apelos', {
        type: 'geojson',
        data: data,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      // Add clustered circle layer
      this.map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'apelos',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#E8B931', // Yellow for small clusters
            10,
            '#E8862E', // Orange for medium
            30,
            '#C1272D', // Red for large
          ],
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
      });

      // Add cluster count labels
      this.map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'apelos',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Add unclustered point layer
      this.map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'apelos',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#C1272D',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });

      // Add halo effect on hover
      this.map.addLayer({
        id: 'unclustered-point-hover',
        type: 'circle',
        source: 'apelos',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'Name'], '']],
        paint: {
          'circle-color': '#C1272D',
          'circle-radius': 14,
          'circle-opacity': 0.3,
        },
      });

      console.log(`Loaded ${data.features.length} points`);
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Erro ao carregar os dados do mapa');
    }
  }

  private setupInteractions(): void {
    // Click on cluster to zoom
    this.map.on('click', 'clusters', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });

      if (features.length === 0) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = this.map.getSource('apelos') as maplibregl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !features[0].geometry || features[0].geometry.type !== 'Point') return;

        this.map.easeTo({
          center: features[0].geometry.coordinates as [number, number],
          zoom: zoom || 14,
          duration: 500,
        });
      });
    });

    // Show popup on point click
    this.map.on('click', 'unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;

      if (!props || feature.geometry?.type !== 'Point') return;

      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      const html = this.createPopupContent(props);

      this.popup.setLngLat(coordinates).setHTML(html).addTo(this.map);

      // Update sidebar
      this.updateSidebar(props);
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', 'unclustered-point', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      
      if (e.features && e.features.length > 0) {
        const name = e.features[0].properties?.Name || '';
        this.map.setFilter('unclustered-point-hover', [
          'all',
          ['!', ['has', 'point_count']],
          ['==', ['get', 'Name'], name],
        ]);
      }
    });

    this.map.on('mouseleave', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = '';
      this.map.setFilter('unclustered-point-hover', [
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

  private showError(message: string): void {
    const infoPanel = document.getElementById('info');
    if (infoPanel) {
      infoPanel.innerHTML = `<p class="error">${message}</p>`;
    }
  }
}

// Initialize the map
new ApelosMap();

