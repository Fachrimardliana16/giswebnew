/**
 * Utility functions for the GIS application
 */

/**
 * Format date in Indonesian locale
 * @param {string|Date} dateValue - Date value to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue) => {
  if (!dateValue) return '-';

  try {
    return new Date(dateValue).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format currency in Indonesian Rupiah
 * @param {number} value - Value to format as currency
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value) return '-';

  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '-';
  }
};

/**
 * Format numeric value with thousand separators
 * @param {number} value - Value to format
 * @returns {string} Formatted number
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';

  try {
    return value.toLocaleString('id-ID');
  } catch (error) {
    console.error('Error formatting number:', error);
    return '-';
  }
};

/**
 * Clean up map markers and popups
 * @param {Object} map - Leaflet map instance
 * @param {Object} currentMarker - Current marker to remove
 * @param {Object} currentPopup - Current popup to close
 * @returns {Object} Object with null marker and popup
 */
export const cleanupMapObjects = (map, currentMarker, currentPopup) => {
  if (currentMarker && map.hasLayer(currentMarker)) {
    map.removeLayer(currentMarker);
  }

  if (currentPopup) {
    map.closePopup();
  }

  // Remove all markers
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  return { currentMarker: null, currentPopup: null };
};

/**
 * Create a highlighted marker for the map
 * @param {Array} latlng - Coordinates [lat, lng]
 * @returns {Object} Leaflet marker with custom icon
 */
export const createHighlightMarker = (latlng) => {
  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 opacity-50 rounded-full animate-ping"></div>
          <div class="relative z-10 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  });
};

/**
 * Get tariff name based on code
 * @param {string} code - Tariff code
 * @returns {string} Tariff name
 */
export const getTariffName = (code) => {
  const tariffCodes = {
    '1': 'ABRI/TNI POLRI',
    '2': 'TNI Yonif 406 CK',
    '3': 'Industri Kecil',
    '4': 'Industri Besar',
    '5': 'Inst. Pemerintah',
    '6': 'Niaga Kecil',
    '7': 'Niaga Besar',
    '8': 'Rumah Tangga A',
    '9': 'Rumah Tangga B',
    '10': 'Rumah Tangga C',
    '11': 'Sosial Umum',
    '12': 'Sosial Khusus',
    '13': 'RT Serang',
    '14': 'Sosial Umum KRJ',
    '15': 'RT Kutabawa',
    '16': 'RT KRETE',
    '17': 'RT Khusus'
  };

  return tariffCodes[code] || `Tarif ${code}`;
};

/**
 * Format rayon value for filtering
 * @param {string} rayonValue - Rayon value to format
 * @returns {string} Formatted rayon value
 */
export const formatRayonFilter = (rayonValue) => {
  try {
    const firstTwo = rayonValue.substring(0, 2);
    const lastTwo = rayonValue.substring(4, 6);
    return firstTwo + lastTwo;
  } catch (err) {
    console.error('Error formatting rayon:', err);
    return rayonValue;
  }
};

/**
 * Debug helper to check if a WMS layer is working correctly
 * @param {string} url - WMS URL
 * @param {Object} params - WMS parameters
 */
export const debugWMSLayer = (url, params) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const fullUrl = `${url}?${queryString}`;
  console.log('WMS Layer URL:', fullUrl);

  // Try a GetMap request
  const getMapUrl = `${url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&STYLES=${params.styles || ''}&LAYERS=${params.layers}&SRS=EPSG:4326&WIDTH=256&HEIGHT=256&BBOX=-180,-90,180,90`;
  console.log('GetMap test URL:', getMapUrl);

  return {
    url: fullUrl,
    getMapUrl
  };
};
