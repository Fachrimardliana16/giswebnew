import { MAP_CENTER, DEFAULT_ZOOM, MAP_BOUNDS, LAYER_ZOOM_LEVELS } from './config.js';

/**
 * Initialize the Leaflet map with base layers and controls
 * @returns {Object} Initialized Leaflet map
 */
export const initializeMap = () => {
  // Create map with basic configuration
  const map = L.map('map', {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 10,
    maxZoom: 19,
    maxBounds: MAP_BOUNDS,
    maxBoundsViscosity: 0.7
  });

  // Add OpenStreetMap base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap Contributors'
  }).addTo(map);

  // Add scale control
  L.control.scale({
    metric: true,
    imperial: false,
    position: 'bottomleft'
  }).addTo(map);

  return map;
};

/**
 * Setup map zoom handler to manage layer visibility
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export const setupMapZoomHandler = (map, layers) => {
  const zoomWarningDiv = L.DomUtil.create('div', 'zoom-warning');
  zoomWarningDiv.style.display = 'none';
  zoomWarningDiv.style.position = 'absolute';
  zoomWarningDiv.style.top = '50%';
  zoomWarningDiv.style.left = '50%';
  zoomWarningDiv.style.transform = 'translate(-50%, -50%)';
  zoomWarningDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  zoomWarningDiv.style.padding = '10px';
  zoomWarningDiv.style.borderRadius = '5px';
  zoomWarningDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  zoomWarningDiv.style.zIndex = '1000';
  map.getContainer().appendChild(zoomWarningDiv);

  map.on('zoomend', function () {
    const currentZoom = map.getZoom();
    let warningMessage = '';

    // Check each visible layer against its zoom requirements
    document.querySelectorAll('.layer-checkbox:checked').forEach(checkbox => {
      const layerId = checkbox.id;
      const layer = layers[layerId];
      const zoomLevels = LAYER_ZOOM_LEVELS[layerId] || LAYER_ZOOM_LEVELS.default;

      if (layer && map.hasLayer(layer)) {
        if (currentZoom < zoomLevels.minZoom) {
          warningMessage = `Perbesar zoom hingga level ${zoomLevels.minZoom} untuk melihat detail`;
          map.removeLayer(layer);
        } else if (currentZoom > zoomLevels.maxZoom) {
          warningMessage = `Perkecil zoom hingga level ${zoomLevels.maxZoom} untuk melihat detail`;
          map.removeLayer(layer);
        } else if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
      }
    });

    // Show/hide warning message
    if (warningMessage) {
      zoomWarningDiv.textContent = warningMessage;
      zoomWarningDiv.style.display = 'block';
      setTimeout(() => {
        zoomWarningDiv.style.display = 'none';
      }, 3000);
    } else {
      zoomWarningDiv.style.display = 'none';
    }
  });
};
