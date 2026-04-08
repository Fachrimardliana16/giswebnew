import { MAP_CENTER, DEFAULT_ZOOM, MAP_BOUNDS, LAYER_ZOOM_LEVELS } from './config.js';
import { showToast } from './toast.js';

/**
 * Initialize the Leaflet map with base layers and controls
 * @returns {Object} Initialized Leaflet map
 */
export const initMap = () => {
  // Define base layers
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap Contributors'
  });

  const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 22,
    attribution: '© Google Maps'
  });

  // Create map with basic configuration
  const map = L.map('map', {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 10,
    maxZoom: 22,
    maxBounds: MAP_BOUNDS,
    maxBoundsViscosity: 0.7,
    zoomControl: false
  });

  // Add zoom control at bottom-right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // Default layer
  osm.addTo(map);

  // Add scale control
  L.control.scale({
    metric: true,
    imperial: false,
    position: 'bottomleft'
  }).addTo(map);

  // Custom Base Map Toggle Logic
  const toggleBtn = document.getElementById('baseMapToggle');
  const label = document.getElementById('baseMapLabel');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isSatellite = map.hasLayer(googleSatellite);
      if (isSatellite) {
        map.removeLayer(googleSatellite);
        map.addLayer(osm);
        osm.bringToBack();
        label.textContent = 'Satelit';
      } else {
        map.removeLayer(osm);
        map.addLayer(googleSatellite);
        googleSatellite.bringToBack();
        label.textContent = 'Peta';
      }
    });
  }

  // Custom Geolocation Logic
  const locationBtn = document.getElementById('getLocationBtn');
  const locationIcon = document.getElementById('locationIcon');
  
  if (locationBtn) {
    locationBtn.addEventListener('click', () => {
      // Toggle: If location already exists, remove it
      if (window.currentUserLocationMarker) {
        map.removeLayer(window.currentUserLocationMarker);
        window.currentUserLocationMarker = null;
        
        // Reset Button UI
        if (locationIcon) {
          locationIcon.classList.replace('bg-red-500', 'bg-emerald-50/50');
          locationIcon.classList.replace('text-white', 'text-emerald-600');
        }
        return;
      }

      if (navigator.geolocation) {
        // Show visual feedback (loading state)
        if (locationIcon) locationIcon.classList.add('animate-pulse');
        locationBtn.classList.add('opacity-70', 'pointer-events-none');

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const latlng = [latitude, longitude];

            // Center map and zoom in
            map.setView(latlng, 20);

            // Add marker for current location with smaller radius
            window.currentUserLocationMarker = L.circle(latlng, {
              radius: 6, // Reduced from 20 to 6 meters
              color: '#059669', // emerald-600
              fillColor: '#10b981', // emerald-500
              fillOpacity: 0.8,
              weight: 3
            }).addTo(map).bindPopup(`
              <div class="text-center p-1">
                <p class="font-black text-[10px] uppercase mb-1" style="color: #64748b;">Lokasi Anda</p>
                <button onclick="window.removeMyLocation()" class="bg-red-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase">Hapus Titik</button>
              </div>
            `, { className: 'custom-gis-popup' }).openPopup();

            // Update Button UI to show active state
            if (locationIcon) {
              locationIcon.classList.remove('animate-pulse');
              locationIcon.classList.replace('bg-emerald-50/50', 'bg-red-500');
              locationIcon.classList.replace('text-emerald-600', 'text-white');
            }
            locationBtn.classList.remove('opacity-70', 'pointer-events-none');
          },
          (error) => {
            console.error('Geolocation Error:', error);
            let msg = 'Gagal mengambil lokasi.';
            if (error.code === 1) msg = 'Izin lokasi ditolak.';
            showToast(msg, 'error');
            if (locationIcon) locationIcon.classList.remove('animate-pulse');
            locationBtn.classList.remove('opacity-70', 'pointer-events-none');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        showToast('Browser Anda tidak mendukung Geolocation.', 'warning');
      }
    });
  }

  // Global helper to remove location layer from popup
  window.removeMyLocation = () => {
    if (window.currentUserLocationMarker) {
      map.removeLayer(window.currentUserLocationMarker);
      window.currentUserLocationMarker = null;
      if (locationIcon) {
        locationIcon.classList.replace('bg-red-500', 'bg-emerald-50/50');
        locationIcon.classList.replace('text-white', 'text-emerald-600');
      }
    }
  };

  return map;
};

/**
 * Setup map zoom handler to manage layer visibility
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export const setupMapZoomHandler = (map, layers) => {
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

    // Show warning message as toast
    if (warningMessage) {
      showToast(warningMessage, 'warning', 2000);
    }
  });
};