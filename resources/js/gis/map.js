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
    maxNativeZoom: 19,
    attribution: '© OpenStreetMap Contributors'
  });

  const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 21,
    maxNativeZoom: 21,
    attribution: '© Google Maps'
  });

  // Create map with basic configuration
  // maxZoom dibatasi 20: di atas itu basemap OSM/Google tidak punya tile,
  // sehingga peta tampak kosong (hanya layer WMS transparan yang tersisa).
  const map = L.map('map', {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 9,
    maxZoom: 20,
    maxBounds: MAP_BOUNDS,
    // viscosity rendah: peta boleh sedikit melewati batas (karet),
    // tapi tetap memantul balik. Sebelumnya 0.7 membuat pojok "mentok".
    maxBoundsViscosity: 0.25,
    zoomControl: false,
    // izinkan scroll wheel & pinch zoom halus
    wheelPxPerZoomLevel: 90,
    zoomSnap: 0.5,
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
/**
 * Kelola visibilitas layer berdasarkan zoom — TANPA menghapus layer.
 *
 * Versi lama memanggil map.removeLayer() saat zoom di luar rentang,
 * sehingga layer "hilang" dan tidak kembali ketika user zoom balik.
 * Sekarang layer dibiarkan terpasang; hanya opacity yang diturunkan
 * agar tidak memicu permintaan tile yang sia-sia.
 */
export const setupMapZoomHandler = (map, layers) => {
  const diterapkan = new Set();

  const terapkan = () => {
    const currentZoom = map.getZoom();
    let peringatan = '';

    document.querySelectorAll('.layer-checkbox:checked').forEach(checkbox => {
      const layerId = checkbox.id;
      const layer = layers[layerId];
      if (!layer) return;

      const z = LAYER_ZOOM_LEVELS[layerId] || LAYER_ZOOM_LEVELS.default;

      if (!map.hasLayer(layer)) return;

      if (currentZoom < z.minZoom) {
        // terlalu jauh: sembunyikan visual, tapi layer tetap "on"
        layer.setOpacity(0);
        peringatan = `Perbesar zoom ke level ${z.minZoom} untuk melihat ${checkbox.dataset.value || 'layer ini'}`;
        diterapkan.add(layerId);
      } else {
        if (diterapkan.has(layerId)) {
          layer.setOpacity(1);
          diterapkan.delete(layerId);
        }
      }
    });

    if (peringatan) {
      showToast(peringatan, 'warning', 2500);
    }
  };

  map.on('zoomend', terapkan);
};

/**
 * Saat layer baru diaktifkan, kalau zoom sekarang terlalu jauh,
 * langsung sesuaikan zoom agar datanya kelihatan (bukan hanya peringatan).
 */
export const sesuaikanZoomUntukLayer = (map, layerId, opsi = {}) => {
  const z = LAYER_ZOOM_LEVELS[layerId] || LAYER_ZOOM_LEVELS.default;
  const current = map.getZoom();
  if (current >= z.minZoom) return false;

  const target = Math.min(z.minZoom, map.getMaxZoom());

  // Kalau layer punya titik data, terbangkan ke sana; jika tidak, zoom di tengah
  if (opsi.center) {
    map.flyTo(opsi.center, target, { duration: 0.9 });
  } else {
    map.flyTo(map.getCenter(), target, { duration: 0.9 });
  }

  showToast(`Zoom disesuaikan ke level ${target} agar data terlihat`, 'info', 2500);
  return true;
};