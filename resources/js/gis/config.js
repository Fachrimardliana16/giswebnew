/**
 * Configuration constants for the GIS application
 */

// Server and map configuration using Laravel Proxy to avoid Mixed Content (HTTPS -> HTTP) issues
export const GEOSERVER_BASE_URL = '/geo-proxy';
export const GEOSERVER_WFS_URL = '/geo-proxy';
export const GEOSERVER_URL = GEOSERVER_BASE_URL;
export const MAP_CENTER = [
  parseFloat(import.meta.env.VITE_MAP_LAT) || -7.385735, 
  parseFloat(import.meta.env.VITE_MAP_LNG) || 109.360430
];
export const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_MAP_ZOOM) || 11;
export const MAP_BOUNDS = [
  [-7.72, 109.02],   // Southwest — diperluas agar pojok wilayah terjangkau
  [-7.10, 109.72]    // Northeast
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
  all_washout: { minZoom: 12, maxZoom: 22 },
  monitoring_pengaduan: { minZoom: 12, maxZoom: 22 },
  // Default values for other layers
  default: { minZoom: 10, maxZoom: 22 }
};

/**
 * Cache-busting berbasis ISI FILTER, bukan angka acak.
 *
 * Sebelumnya setiap setParams memakai Math.random(), sehingga URL tile
 * selalu baru dan cache browser tidak pernah terpakai — setiap pan/zoom
 * memaksa GeoServer menggambar ulang seluruh layar.
 * Dengan hash filter, filter yang sama = URL sama = cache kena.
 */
const hashString = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
};

export const versiFilter = (cql) => (cql ? hashString(String(cql)) : 'default');

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
        // SELALU tiled: tile 256px jauh lebih ringan daripada satu gambar
        // seukuran layar, dan hasilnya bisa di-cache per tile.
        tiled: true,
        zIndex: 400,
        maxZoom: zoomLevels.maxZoom,
        minZoom: zoomLevels.minZoom,
        crossOrigin: true,
        buffer: 0,
        // Jangan minta tile baru saat animasi zoom berjalan; tunggu berhenti.
        // Ini memotong request berlipat saat pinch/wheel zoom.
        updateWhenZooming: false,
        // Jaga tile di sekitar viewport agar geser kecil tak memicu render ulang
        keepBuffer: 3,
        // Tunggu peta diam sebelum memuat (kurangi request beruntun)
        updateWhenIdle: true,
        // Jeda minimal antar permintaan tile saat pan cepat
        updateInterval: 150,
    };

    const finalOptions = { ...baseOptions, ...customOptions };
    const layer = L.tileLayer.wms(GEOSERVER_URL, finalOptions);

    // Track loading state globally
    if (typeof window.loadingLayersCount === 'undefined') {
        window.loadingLayersCount = 0;
    }

    const showLoader = () => {
        window.loadingLayersCount++;
        const loader = document.getElementById('loadingIndicator');
        const zoomHint = document.getElementById('zoomHint');
        
        if (loader) loader.classList.replace('hidden', 'flex');
        
        // Show zoom hint if current zoom is lower than this layer's minZoom
        if (window.map) {
            const currentZoom = window.map.getZoom();
            if (currentZoom < baseOptions.minZoom && zoomHint) {
                zoomHint.classList.remove('hidden');
            }
        }

        // Trigger watchdog if available (from dashboard.blade.php)
        if (window.startLoadingWatchdog) window.startLoadingWatchdog();
    };

    const hideLoader = () => {
        window.loadingLayersCount--;
        if (window.loadingLayersCount <= 0) {
            window.loadingLayersCount = 0;
            const loader = document.getElementById('loadingIndicator');
            const zoomHint = document.getElementById('zoomHint');
            if (loader) loader.classList.replace('flex', 'hidden');
            if (zoomHint) zoomHint.classList.add('hidden');
            // Stop watchdog
            if (window.stopLoadingWatchdog) window.stopLoadingWatchdog();
        }
    };

    layer.on('loading', showLoader);
    layer.on('load', hideLoader);
    layer.on('tileerror', hideLoader);

    return layer;
};
