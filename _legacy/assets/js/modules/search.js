import { searchFeaturesByProperty } from './api.js';
import { createHighlightMarker, cleanupMapObjects } from '../utils/helpers.js';
import { createCustomerPopupContent } from './popupTemplates.js';

let currentMarker = null;
let currentPopup = null;

/**
 * Setup search functionality
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export const setupSearchFeatures = (map, layers) => {
  window.searchFeatures = function() {
    // Get search input elements
    const searchInput = document.getElementById('searchInput');
    const searchLayer = document.getElementById('searchLayer');

    if (!searchInput || !searchLayer) {
      console.warn('Search elements not found');
      return;
    }

    const searchText = searchInput.value.trim();
    const selectedLayer = searchLayer.value;

    // Validate search input
    if (!searchText) {
      alert('Silakan masukkan nomor langganan');
      return;
    }

    // Clean up previous results
    const cleanupResult = cleanupMapObjects(map, currentMarker, currentPopup);
    currentMarker = cleanupResult.currentMarker;
    currentPopup = cleanupResult.currentPopup;

    // Make sure customer layer is visible
    const pelangganCheckbox = document.getElementById('analisa_pelanggan');
    if (pelangganCheckbox && !pelangganCheckbox.checked) {
      pelangganCheckbox.checked = true;
      if (!map.hasLayer(layers.analisa_pelanggan)) {
        layers.analisa_pelanggan.addTo(map);
      }
    }

    // Perform search
    searchFeaturesByProperty('analisa_pelanggan', 'nolang', searchText)
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const coordinates = feature.geometry.coordinates;
          const latlng = L.latLng(coordinates[1], coordinates[0]);

          // Center map on result
          map.setView(latlng, 19);
          showSearchResultPopup(map, feature, latlng, coordinates);
        } else {
          alert('Tidak ditemukan hasil yang cocok');
        }
      })
      .catch(error => {
        console.error('Search error:', error);
        alert('Terjadi kesalahan saat mencari data. Silakan coba lagi.');
      });
  };

  /**
   * Show popup for search result
   * @param {Object} map - Leaflet map instance
   * @param {Object} feature - GeoJSON feature
   * @param {Object} latlng - Popup position
   * @param {Array} coordinates - Feature coordinates
   */
  function showSearchResultPopup(map, feature, latlng, coordinates) {
    try {
      const properties = feature.properties;
      const popupContent = createCustomerPopupContent(properties, coordinates);

      // Create marker and popup
      currentMarker = createHighlightMarker(latlng).addTo(map);

      currentPopup = L.popup({
        maxWidth: 280,
        className: 'custom-popup',
        closeButton: true,
        autoClose: false,
        closeOnClick: false
      })
        .setLatLng(latlng)
        .setContent(popupContent)
        .openOn(map);

      currentPopup.on('remove', () => {
        const cleanupResult = cleanupMapObjects(map, currentMarker, currentPopup);
        currentMarker = cleanupResult.currentMarker;
        currentPopup = cleanupResult.currentPopup;
      });

    } catch (error) {
      console.error('Error showing search result:', error);
      cleanupMapObjects(map, currentMarker, currentPopup);
      alert('Terjadi kesalahan saat menampilkan informasi. Silakan coba lagi.');
    }
  }

  // Set up search button click event
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', window.searchFeatures);
  }

  // Set up Enter key press in search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        window.searchFeatures();
      }
    });
  }
};
