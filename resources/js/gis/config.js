/**
 * Configuration constants for the GIS application
 */

// Server and map configuration
export const GEOSERVER_BASE_URL = import.meta.env.VITE_GEOSERVER_URL || 'http://36.93.220.245:8080/geoserver/webgis/wms';
export const GEOSERVER_WFS_URL = import.meta.env.VITE_GEOSERVER_WFS_URL || 'http://36.93.220.245:8080/geoserver/webgis/ows';
export const GEOSERVER_URL = GEOSERVER_BASE_URL;
export const MAP_CENTER = [
  parseFloat(import.meta.env.VITE_MAP_LAT) || -7.385735, 
  parseFloat(import.meta.env.VITE_MAP_LNG) || 109.360430
];
export const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_MAP_ZOOM) || 11;
export const MAP_BOUNDS = [
  [-7.5, 109.2],   // Southwest
  [-7.2, 109.5]    // Northeast
];

// Layer zoom level configurations
export const LAYER_ZOOM_LEVELS = {
  analisa_pelanggan: { minZoom: 12, maxZoom: 22 },
  web_pipa: { minZoom: 10, maxZoom: 22 },
  // Accessories
  all_airvalve: { minZoom: 12, maxZoom: 22 },
  all_bend: { minZoom: 12, maxZoom: 22 },
  all_checkvalve: { minZoom: 12, maxZoom: 22 },
  all_dop: { minZoom: 12, maxZoom: 22 },
  all_firehydrant: { minZoom: 12, maxZoom: 22 },
  all_gatevalve: { minZoom: 12, maxZoom: 22 },
  all_meterinduk: { minZoom: 12, maxZoom: 22 },
  all_prv: { minZoom: 12, maxZoom: 22 },
  all_reducer: { minZoom: 12, maxZoom: 22 },
  all_strainer: { minZoom: 12, maxZoom: 22 },
  all_tee: { minZoom: 12, maxZoom: 22 },
  all_titik_tekanan: { minZoom: 12, maxZoom: 22 },
  all_washout1: { minZoom: 12, maxZoom: 22 },
  monitoring_pengaduan: { minZoom: 12, maxZoom: 22 },
  // Default values for other layers
  default: { minZoom: 10, maxZoom: 22 }
};

/**
 * Create a WMS layer with default and custom options
 * @param {string} name - Layer name
 * @param {Object} customOptions - Custom layer options
 * @returns {Object} Leaflet WMS tile layer
 */
export const createWMSLayer = (name, customOptions = {}) => {
    // Get zoom levels for the layer or use defaults
    const zoomLevels = LAYER_ZOOM_LEVELS[name] || LAYER_ZOOM_LEVELS.default;

    const baseOptions = {
        layers: `webgis:${name}`,
        format: 'image/png',
        transparent: true,
        tiled: true,
        zIndex: 400,
        maxZoom: zoomLevels.maxZoom,
        minZoom: zoomLevels.minZoom,
        crossOrigin: true,
        buffer: 0,
        updateInterval: 200
    };

    // Special handling for pipe layers
    if (name === 'web_pipa' && customOptions.cql_filter) {
        const isPipeSource = customOptions.cql_filter.includes('MA') || 
                           customOptions.cql_filter.includes('Reservoar') || 
                           customOptions.cql_filter.includes('CAKOT');
        
        if (isPipeSource) {
            Object.assign(baseOptions, {
                format: 'image/png',
                transparent: true,
                tiled: true,
                opacity: 1.0,
                zIndex: 999,
                buffer: 0,
                updateWhenIdle: false,
                updateWhenZooming: false,
                keepBuffer: 2
            });
        }
    }

    const finalOptions = { ...baseOptions, ...customOptions };
    return L.tileLayer.wms(GEOSERVER_URL, finalOptions);
};
