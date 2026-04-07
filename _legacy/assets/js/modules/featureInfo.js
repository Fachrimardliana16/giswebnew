// js/modules/featureInfo.js
import { eventManager } from './eventManager.js';
import { makeGetFeatureInfoRequest } from './api.js';
import { createHighlightMarker, cleanupMapObjects, formatDate } from '../utils/helpers.js';
import {
  createCustomerPopupContent,
  createPipePopupContent,
  createAccessoryPopupContent
} from './popupTemplates.js';

let currentMarker = null;
let currentPopup = null;

/**
 * Setup feature info on map click
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 * @param {Object} e - Click event
 */
export const setupGetFeatureInfo = (map, layers, e) => {
  // Clean up previous markers and popups
  const cleanupResult = cleanupMapObjects(map, currentMarker, currentPopup);
  currentMarker = cleanupResult.currentMarker;
  currentPopup = cleanupResult.currentPopup;

  // Process customer layer
  if (map.hasLayer(layers.analisa_pelanggan)) {
    handleCustomerLayer(map, layers, e);
  }

  // Process pipe layers
  handlePipeLayers(map, layers, e);

  // Process accessory layers
  handleAccessoryLayers(map, layers, e);

  // Handle complaint layer
  handleComplaintLayer(map, layers, e);
};

/**
 * Handle customer layer feature info
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 * @param {Object} e - Click event
 */
const handleCustomerLayer = (map, layers, e) => {
  // Get all active filters from event manager
  const filters = eventManager.getAllFilters();
  const activeFilters = [];

  // Build filter conditions
  if (filters.status) activeFilters.push(`status='${filters.status}'`);
  if (filters.cabang) activeFilters.push(`cabang='${filters.cabang}'`);
  if (filters.tarif) activeFilters.push(`tarif='${filters.tarif}'`);
  if (filters.valid === 'true') activeFilters.push('isvalid=true');
  if (filters.valid === 'false') activeFilters.push('isvalid=false');

  if (filters.umurWM) {
    switch (filters.umurWM) {
      case 'none':
        activeFilters.push('(umurwm_tahun IS NULL OR umurwm_tahun = 0 OR umurwm_tahun < 0)');
        break;
      case '5':
        activeFilters.push('(umurwm_tahun >= 0 AND umurwm_tahun <= 5)');
        break;
      case '10':
        activeFilters.push('(umurwm_tahun > 5 AND umurwm_tahun <= 10)');
        break;
      case '15':
        activeFilters.push('(umurwm_tahun > 10 AND umurwm_tahun <= 15)');
        break;
      case 'above15':
        activeFilters.push('(umurwm_tahun > 15)');
        break;
    }
  }

  // Add tunggakan filter with corrected column name
  if (filters.tunggakan && filters.tunggakan.length > 0) {
    if (filters.tunggakan.includes('all')) {
      activeFilters.push('tungg_lembar > 0');
    } else {
      const tunggakanQueries = filters.tunggakan.map(value => {
        if (value === 'above6') {
          return 'tungg_lembar > 6';
        }
        return `tungg_lembar = ${value}`;
      });
      activeFilters.push(`(${tunggakanQueries.join(' OR ')})`);
    }
  }

  // Make request to GeoServer
  makeGetFeatureInfoRequest(map, 'analisa_pelanggan', e.latlng, {
    cqlFilter: activeFilters.length > 0 ? activeFilters.join(' AND ') : null,
    buffer: 15
  })
    .then(data => {
      if (data.features && data.features.length > 0) {
        if (activeFilters.length > 0) {
          // Filter matching features if filters are active
          const matchingFeatures = data.features.filter(feature => {
            const props = feature.properties;
            let matches = true;

            if (filters.status) {
              matches = matches && props.status === filters.status;
            }
            if (filters.cabang) {
              matches = matches && props.cabang === filters.cabang;
            }
            if (filters.tarif) {
              matches = matches && props.tarif === filters.tarif;
            }
            if (filters.valid === 'true') {
              matches = matches && props.isvalid === true;
            }
            if (filters.valid === 'false') {
              matches = matches && props.isvalid === false;
            }

            if (filters.umurWM) {
              const umurWM = props.umurwm_tahun;
              switch (filters.umurWM) {
                case 'none':
                  matches = matches && (!umurWM || umurWM === 0 || umurWM < 0);
                  break;
                case '5':
                  matches = matches && umurWM >= 0 && umurWM <= 5;
                  break;
                case '10':
                  matches = matches && umurWM > 5 && umurWM <= 10;
                  break;
                case '15':
                  matches = matches && umurWM > 10 && umurWM <= 15;
                  break;
                case 'above15':
                  matches = matches && umurWM > 15;
                  break;
              }
            }

            if (filters.tunggakan && filters.tunggakan.length > 0) {
              const tunggakan = props.tungg_lembar;
              if (filters.tunggakan.includes('all')) {
                matches = matches && tunggakan > 0;
              } else {
                const tunggakanMatches = filters.tunggakan.some(value => {
                  if (value === 'above6') {
                    return tunggakan > 6;
                  }
                  return tunggakan === parseInt(value, 10);
                });
                matches = matches && tunggakanMatches;
              }
            }

            return matches;
          });

          if (matchingFeatures.length > 0) {
            showCustomerPopup(map, matchingFeatures[0], e.latlng);
          }
        } else {
          // Show popup directly if no filters
          showCustomerPopup(map, data.features[0], e.latlng);
        }
      }
    })
    .catch(error => {
      console.error('GetFeatureInfo error for customer:', error);
    });
};

/**
 * Handle pipe layers feature info
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 * @param {Object} e - Click event
 */
const handlePipeLayers = (map, layers, e) => {
  // Check diameter-based pipe layers
  const pipeLayers = ['pipa400', 'pipa300', 'pipa250', 'pipa200', 'pipa150',
    'pipa100', 'pipa75', 'pipa65', 'pipa50', 'pipa40',
    'pipa25', 'pipa20', 'pipa15'];

  const activePipeLayers = pipeLayers.filter(layerKey => map.hasLayer(layers[layerKey]));

  if (activePipeLayers.length > 0) {
    const activePipeDiameters = activePipeLayers.map(layer => layer.replace('pipa', ''));
    const diameterFilter = activePipeDiameters.map(diameter => `diameter=${diameter}`).join(' OR ');

    makeGetFeatureInfoRequest(map, 'web_pipa', e.latlng, {
      cqlFilter: `(${diameterFilter})`,
      buffer: 25
    })
      .then(data => {
        if (data.features && data.features.length > 0) {
          showPipePopup(map, data.features[0], e.latlng);
        }
      })
      .catch(error => {
        console.error('GetFeatureInfo error for pipe by diameter:', error);
      });
  }

  // Check for water source pipe layers
  const sumbermaLayers = [
    'pipaReservoarKaranglewas', 'pipaReservoarMeri', 'pipaReservoarKaranggambas',
    'pipaReservoarWalik', 'pipaMALimbangan', 'pipaMAKajongan', 'pipaMAMulang2',
    'pipaCakotWalikKota1', 'pipaMAGombangan', 'pipaCakotWalikKota2', 'pipaMATukArus',
    'pipaMASikopyah', 'pipaMALimpakdau', 'pipaMAWadasKelir', 'pipaMAPajerukan'
  ];

  const activeSumbermaLayers = sumbermaLayers.filter(layerKey => map.hasLayer(layers[layerKey]));

  if (activeSumbermaLayers.length > 0) {
    const activeSumberMA = activeSumbermaLayers.map(layer => {
      let sumberma;
      if (layer.includes('Reservoar')) {
        sumberma = 'Reservoar ' + layer.split('Reservoar')[1];
      } else if (layer.includes('MA')) {
        sumberma = 'MA ' + layer.split('MA')[1];
      } else if (layer.includes('Cakot')) {
        sumberma = 'CAKOT WALIK KOTA ' + layer.split('CakotWalikKota')[1];
      }
      return `sumberma='${sumberma}'`;
    });

    const sumbermaFilter = activeSumberMA.join(' OR ');

    makeGetFeatureInfoRequest(map, 'web_pipa', e.latlng, {
      cqlFilter: `(${sumbermaFilter})`,
      buffer: 50
    })
      .then(data => {
        if (data.features && data.features.length > 0) {
          showPipePopup(map, data.features[0], e.latlng);
        }
      })
      .catch(error => {
        console.error('GetFeatureInfo error for pipe by source:', error);
      });
  }
};

/**
 * Handle accessory layers feature info
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 * @param {Object} e - Click event
 */
const handleAccessoryLayers = (map, layers, e) => {
  const aksesorisLayers = {
    'all_airvalve': 'all_airvalve',
    'all_bend': 'all_bend',
    'all_checkvalve': 'all_checkvalve',
    'all_dop': 'all_dop',
    'all_firehydrant': 'all_firehydrant',
    'all_gatevalve': 'all_gatevalve',
    'all_meterinduk': 'all_meterinduk',
    'all_prv': 'all_prv',
    'all_reducer': 'all_reducer',
    'all_strainer': 'all_strainer',
    'all_tee': 'all_tee',
    'all_titik_tekanan': 'all_titik_tekanan',
    'all_washout': 'all_washout1'
  };

  const activeAksesorisLayers = Object.keys(aksesorisLayers)
    .filter(layerKey => map.hasLayer(layers[layerKey]));

  if (activeAksesorisLayers.length > 0) {
    const activeLayerKey = activeAksesorisLayers[0];
    const layerName = aksesorisLayers[activeLayerKey];

    makeGetFeatureInfoRequest(map, layerName, e.latlng, {
      buffer: 15
    })
      .then(data => {
        if (data.features && data.features.length > 0) {
          showAccessoryPopup(map, data.features[0], e.latlng, activeLayerKey);
        }
      })
      .catch(error => {
        console.error('GetFeatureInfo error for accessory:', error);
      });
  }
};

/**
 * Handle complaint layer feature info
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 * @param {Object} e - Click event
 */
const handleComplaintLayer = (map, layers, e) => {
  if (map.hasLayer(layers.monitoring_pengaduan)) {
    const statusFilter = document.getElementById('statusPengaduanFilter').value;
    const cqlFilter = statusFilter ? `compliantstatusid=${statusFilter}` : null;

    makeGetFeatureInfoRequest(map, 'monitoring_pengaduan', e.latlng, {
      cqlFilter: cqlFilter,
      buffer: 15
    })
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          // Only show features that match the current status filter
          if (!statusFilter || feature.properties.compliantstatusid === parseInt(statusFilter)) {
            showComplaintPopup(map, feature, e.latlng);
          }
        }
      })
      .catch(error => {
        console.error('GetFeatureInfo error for complaint:', error);
      });
  }
};

/**
 * Show customer popup
 */
const showCustomerPopup = (map, feature, clickLatLng) => {
  try {
    if (!feature || !feature.properties) {
      console.error('Invalid feature data:', feature);
      return;
    }

    const coordinates = feature.geometry ? feature.geometry.coordinates : [clickLatLng.lng, clickLatLng.lat];
    const popupLatLng = clickLatLng;

    // Create popup content using imported function
    const popupContent = createCustomerPopupContent(feature.properties, coordinates);

    // Create marker and popup
    currentMarker = createHighlightMarker(popupLatLng).addTo(map);

    currentPopup = L.popup({
      maxWidth: 280,
      className: 'custom-popup',
      closeButton: true,
      autoClose: true,
      closeOnClick: true
    })
      .setLatLng(popupLatLng)
      .setContent(popupContent)
      .openOn(map);

    // Handle popup close
    currentPopup.on('remove', () => {
      if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
      }
      currentPopup = null;
    });

  } catch (error) {
    console.error('Error showing customer popup:', error);
    cleanupMapObjects(map, currentMarker, currentPopup);
    alert('Terjadi kesalahan saat menampilkan informasi pelanggan. Silakan coba lagi.');
  }
};

/**
 * Show pipe popup
 */
const showPipePopup = (map, feature, clickLatLng) => {
  try {
    if (!feature || !feature.properties) return;
    const popupContent = createPipePopupContent(feature.properties, clickLatLng);
    currentMarker = createHighlightMarker(clickLatLng).addTo(map);
    currentPopup = L.popup({
      maxWidth: 280,
      className: 'custom-popup',
      closeButton: true,
      autoClose: true,
      closeOnClick: true
    })
      .setLatLng(clickLatLng)
      .setContent(popupContent)
      .openOn(map);

    currentPopup.on('remove', () => {
      if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
      }
      currentPopup = null;
    });
  } catch (error) {
    console.error('Error showing pipe popup:', error);
    cleanupMapObjects(map, currentMarker, currentPopup);
  }
};

/**
 * Show accessory popup
 */
const showAccessoryPopup = (map, feature, clickLatLng, type) => {
  try {
    if (!feature || !feature.properties) return;
    const popupContent = createAccessoryPopupContent(feature.properties, clickLatLng, type);
    currentMarker = createHighlightMarker(clickLatLng).addTo(map);
    currentPopup = L.popup({
      maxWidth: 280,
      className: 'custom-popup',
      closeButton: true,
      autoClose: true,
      closeOnClick: true
    })
      .setLatLng(clickLatLng)
      .setContent(popupContent)
      .openOn(map);

    currentPopup.on('remove', () => {
      if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
      }
      currentPopup = null;
    });
  } catch (error) {
    console.error('Error showing accessory popup:', error);
    cleanupMapObjects(map, currentMarker, currentPopup);
  }
};

/**
 * Show complaint popup
 */
const showComplaintPopup = (map, feature, clickLatLng) => {
  try {
    if (!feature || !feature.properties) {
      console.error('Invalid feature data:', feature);
      return;
    }

    const coordinates = feature.geometry ? feature.geometry.coordinates : [clickLatLng.lng, clickLatLng.lat];
    const popupLatLng = clickLatLng;
    
    // Build popup content directly instead of using generatePopupContent
    const content = `
    <div class="rounded-lg shadow-sm overflow-hidden" style="max-width: 280px;">
      <div class="bg-blue-50 px-2 py-1 border-b border-blue-100">
        <h3 class="font-semibold text-blue-800 text-sm">Informasi Pengaduan</h3>
      </div>
      <div class="max-h-[200px] overflow-y-auto bg-white p-1">
        <table class="w-full border-collapse text-left">
          <tbody>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Tanggal Pengaduan</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${formatDate(feature.properties.datecompliant) || '-'}</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Nama Pelapor</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${feature.properties.complianername || '-'}</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Nomor Telepon</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${feature.properties.phonenumber || '-'}</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Alamat</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${feature.properties.complianeraddress || '-'}</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Isi Pengaduan</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${feature.properties.compliantcontent || '-'}</td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">Status Pengaduan</td>
              <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${getStatusText(feature.properties.compliantstatusid)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-gray-50 px-2 py-1 border-t border-gray-200 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.open('https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}', '_blank')"
                  class="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm
                        transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Lihat di Maps
          </button>
          <button onclick="window.open('https://wa.me/${feature.properties.phonenumber?.replace(/\D/g, '')}', '_blank')"
                  class="px-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm
                        transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hubungi
          </button>
        </div>
      </div>
    </div>`;

    // Create marker and popup
    currentMarker = createHighlightMarker(popupLatLng).addTo(map);

    currentPopup = L.popup({
      maxWidth: 280,
      className: 'custom-popup',
      closeButton: true,
      autoClose: true,
      closeOnClick: true
    })
      .setLatLng(popupLatLng)
      .setContent(content)
      .openOn(map);

    // Handle popup close
    currentPopup.on('remove', () => {
      if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
      }
      currentPopup = null;
    });

  } catch (error) {
    console.error('Error showing complaint popup:', error);
    console.error('Error details:', {
      feature: feature,
      properties: feature?.properties,
      coordinates: feature?.geometry?.coordinates
    });
    cleanupMapObjects(map, currentMarker, currentPopup);
    alert('Terjadi kesalahan saat menampilkan informasi pengaduan. Silakan coba lagi.');
  }
};

// Helper function to get status text
const getStatusText = (statusId) => {
  const statusMap = {
    '1': 'Dilaporkan',
    '2': 'Diterima',
    '3': 'Dikerjakan',
    '4': 'Selesai'
  };
  return statusMap[statusId] || 'Unknown';
};
