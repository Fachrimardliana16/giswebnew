// js/modules/filter.js
import { eventManager } from './eventManager.js';
import { formatRayonFilter } from '../utils/helpers.js';

/**
 * Setup customer status filtering
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
function setupStatusFilter(map, layers) {
  const statusFilter = document.getElementById('statusFilter');
  const validFilter = document.getElementById('validFilter');
  const tarifFilter = document.getElementById('tarifFilter');
  const umurWMFilter = document.getElementById('umurWMFilter');
  const cabangFilter = document.getElementById('cabangFilter');

  /**
   * Build CQL filter based on selected filters
   * @returns {string} CQL filter string
   */
  function buildCQLFilter() {
    const conditions = [];
    const activeFilters = {};

    // Status filter
    if (statusFilter && statusFilter.value) {
      eventManager.setStatusFilter(statusFilter.value);
      conditions.push(`status='${statusFilter.value}'`);
      activeFilters.status = statusFilter.value;
    } else {
      eventManager.setStatusFilter(null);
    }

    // Valid filter
    if (validFilter && validFilter.value) {
      eventManager.setValidFilter(validFilter.value);
      if (validFilter.value === 'true') {
        conditions.push('isvalid=true');
        activeFilters.valid = true;
      } else if (validFilter.value === 'false') {
        conditions.push('isvalid=false');
        activeFilters.valid = false;
      }
    } else {
      eventManager.setValidFilter(null);
    }

    // Cabang filter
    if (cabangFilter && cabangFilter.value) {
      eventManager.setCabangFilter(cabangFilter.value);
      conditions.push(`cabang='${cabangFilter.value}'`);
      activeFilters.cabang = cabangFilter.value;
    }

    // Tariff filter
    if (tarifFilter && tarifFilter.value) {
      eventManager.setTarifFilter(tarifFilter.value);
      conditions.push(`tarif='${tarifFilter.value}'`);
      activeFilters.tarif = tarifFilter.value;
    } else {
      eventManager.setTarifFilter(null);
    }

    // Water meter age filter
    if (umurWMFilter && umurWMFilter.value) {
      eventManager.setUmurWMFilter(umurWMFilter.value);
      activeFilters.umurWM = umurWMFilter.value;

      switch (umurWMFilter.value) {
        case 'none':
          conditions.push('(umurwm_tahun IS NULL OR umurwm_tahun = 0 OR umurwm_tahun < 0)');
          break;
        case '5':
          conditions.push('(umurwm_tahun >= 0 AND umurwm_tahun <= 5)');
          break;
        case '10':
          conditions.push('(umurwm_tahun > 5 AND umurwm_tahun <= 10)');
          break;
        case '15':
          conditions.push('(umurwm_tahun > 10 AND umurwm_tahun <= 15)');
          break;
        case 'above15':
          conditions.push('(umurwm_tahun > 15)');
          break;
      }
    } else {
      eventManager.setUmurWMFilter(null);
    }

    // Rayon filter
    const selectedRayons = Array.from(document.querySelectorAll('input[name="rayon[]"]:checked'))
      .map(checkbox => checkbox.value);

    if (selectedRayons.length > 0) {
      const rayonQueries = selectedRayons.map(rayon => {
        const formattedRayon = formatRayonFilter(rayon);
        return `nolang LIKE '${formattedRayon}%'`;
      });
      conditions.push(`(${rayonQueries.join(' OR ')})`);
      activeFilters.rayons = selectedRayons;
    }

    // Tunggakan filter - updated column name to tungg_lembar
    const selectedTunggakan = Array.from(document.querySelectorAll('input[name="tunggakan[]"]:checked'))
      .map(checkbox => checkbox.value);

    if (selectedTunggakan.length > 0) {
      eventManager.setTunggakanFilter(selectedTunggakan);
      activeFilters.tunggakan = selectedTunggakan;

      if (selectedTunggakan.includes('all')) {
        conditions.push('tungg_lembar > 0');
      } else {
        const tunggakanQueries = selectedTunggakan.map(value => {
          if (value === 'above6') {
            return 'tungg_lembar > 6';
          }
          return `tungg_lembar = ${value}`;
        });
        conditions.push(`(${tunggakanQueries.join(' OR ')})`);
      }
    } else {
      eventManager.setTunggakanFilter(null);
    }

    // Log active filters
    console.log('Active Filters:', {
      conditions: conditions.join(' AND '),
      filters: activeFilters,
      totalActiveFilters: Object.keys(activeFilters).length
    });

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  /**
   * Apply filters to the customer layer
   */
  function applyFilter() {
    if (!layers || !layers.analisa_pelanggan) return;

    const pelangganCheckbox = document.querySelector('.pelanggan-checkbox');
    const isCustomerLayerActive = pelangganCheckbox && pelangganCheckbox.checked;

    // Ensure layer is added to map if not already
    if (!map.hasLayer(layers.analisa_pelanggan) && isCustomerLayerActive) {
      layers.analisa_pelanggan.addTo(map);
    }

    const cqlFilter = buildCQLFilter();
    console.log('Applying CQL filter:', cqlFilter);

    // Only update parameters if layer is active
    if (isCustomerLayerActive) {
      layers.analisa_pelanggan.setParams({
        cql_filter: cqlFilter,
        random: Math.random()
      });
    }

    // Log current state
    console.log('Layer Status:', {
      customerLayer: isCustomerLayerActive ? 'Active' : 'Inactive',
      filters: {
        cabang: cabangFilter?.value || 'Not set',
        status: statusFilter?.value || 'Not set',
        tarif: tarifFilter?.value || 'Not set',
        valid: validFilter?.value || 'Not set',
        umurWM: umurWMFilter?.value || 'Not set',
        rayons: document.querySelectorAll('input[name="rayon[]"]:checked').length + ' selected',
        tunggakan: document.querySelectorAll('input[name="tunggakan[]"]:checked').length + ' selected'
      },
      appliedFilter: cqlFilter
    });

    // Close any open popups and remove markers
    map.closePopup();
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
  }

  // Setup debounced filter changes to avoid excessive server requests
  let filterTimeout;
  function handleFilterChange(filter) {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      applyFilter();
    }, 300);
  }

  // Setup event listeners for filters
  [statusFilter, cabangFilter, validFilter, tarifFilter, umurWMFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', () => handleFilterChange(filter));
    }
  });

  // Setup rayon filter checkboxes
  document.querySelectorAll('input[name="rayon[]"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      handleFilterChange(checkbox);
    });
  });

  // Setup tunggakan filter checkboxes
  document.querySelectorAll('input[name="tunggakan[]"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const pelangganCheckbox = document.querySelector('.pelanggan-checkbox');
      
      // Ensure customer layer is active when applying tunggakan filter
      if (!pelangganCheckbox.checked) {
        pelangganCheckbox.checked = true;
        if (!map.hasLayer(layers.analisa_pelanggan)) {
          layers.analisa_pelanggan.addTo(map);
        }
      }

      // Handle "Semua tunggakan" logic
      if (e.target.value === 'all' && e.target.checked) {
        document.querySelectorAll('input[name="tunggakan[]"]').forEach(cb => {
          if (cb !== e.target) {
            cb.checked = false;
          }
        });
      } else if (e.target.value !== 'all' && e.target.checked) {
        const allCheckbox = document.querySelector('input[name="tunggakan[]"][value="all"]');
        if (allCheckbox) {
          allCheckbox.checked = false;
        }
      }

      handleFilterChange(checkbox);
    });
  });

  // Add event listener for customer layer checkbox
  const pelangganCheckbox = document.querySelector('.pelanggan-checkbox');
  if (pelangganCheckbox) {
    pelangganCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        layers.analisa_pelanggan.addTo(map);
        applyFilter(); // Re-apply existing filters
      } else {
        map.removeLayer(layers.analisa_pelanggan);
      }
    });
  }

  // Initial filter application
  applyFilter();
}

/**
 * Setup pipe source filter controls
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
function setupPipaSumbermaControls(map, layers) {
  document.querySelectorAll('.pipa-sumberma-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const layerId = e.target.id;
      const layer = layers[layerId];

      if (!layer) {
        console.error(`Layer not found: ${layerId}`);
        return;
      }

      if (e.target.checked) {
        // Uncheck diameter pipes first
        document.querySelectorAll('.pipa-checkbox').forEach(pipaCheckbox => {
          if (pipaCheckbox.checked) {
            pipaCheckbox.checked = false;
            const pipaLayer = layers[pipaCheckbox.id];
            if (pipaLayer && map.hasLayer(pipaLayer)) {
              map.removeLayer(pipaLayer);
            }
          }
        });

        // Remove and recreate layer
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }

        // Use standard pipe layer parameters
        layer.setParams({
          random: Math.random(),
          format: 'image/png',
          transparent: true,
          tiled: true,
          opacity: 1.0,
          zIndex: 999,
          buffer: 0
        });

        console.log(`Adding ${layerId}`);
        layer.addTo(map);

        // Force redraw
        setTimeout(() => {
          map.invalidateSize();
          layer.redraw();
        }, 100);

      } else {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    });
  });

  // Setup uncheck button
  const uncheckButton = document.getElementById('uncheckPipaSumberma');
  if (uncheckButton) {
    uncheckButton.addEventListener('click', () => {
      document.querySelectorAll('.pipa-sumberma-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
          checkbox.checked = false;
          const layer = layers[checkbox.id];
          if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        }
      });
    });
  }
}

/**
 * Setup complaint status filtering
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
function setupComplaintFilter(map, layers) {
  const statusPengaduanFilter = document.getElementById('statusPengaduanFilter');

  function applyComplaintFilter() {
    if (!layers.monitoring_pengaduan) {
      console.warn('Complaint layer not found');
      return;
    }

    const pengaduanCheckbox = document.getElementById('monitoring_pengaduan');
    console.log('Current Pengaduan Layer Status:', {
      checkboxFound: !!pengaduanCheckbox,
      isChecked: pengaduanCheckbox?.checked
    });

    if (!pengaduanCheckbox || !pengaduanCheckbox.checked) return;

    let cqlFilter = '1=1';
    let statusText = 'Semua Pengaduan';
    
    if (statusPengaduanFilter && statusPengaduanFilter.value) {
      statusText = getStatusText(statusPengaduanFilter.value);
      cqlFilter = `compliantstatusid=${statusPengaduanFilter.value}`;
      console.log('Status Pengaduan Changed:', {
        value: statusPengaduanFilter.value,
        text: statusText,
        filter: cqlFilter
      });
      
      eventManager.setComplaintStatusFilter(statusPengaduanFilter.value);
    } else {
      console.log('No status filter selected - showing all complaints');
      eventManager.setComplaintStatusFilter(null);
    }

    if (!map.hasLayer(layers.monitoring_pengaduan)) {
      layers.monitoring_pengaduan.addTo(map);
      console.log('Added monitoring_pengaduan layer to map');
    }

    layers.monitoring_pengaduan.setParams({
      cql_filter: cqlFilter,
      random: Math.random()
    });

    console.log('Applied Complaint Filter:', {
      status: {
        id: statusPengaduanFilter?.value || 'none',
        text: statusText
      },
      cqlFilter: cqlFilter,
      layerActive: map.hasLayer(layers.monitoring_pengaduan),
      timestamp: new Date().toLocaleTimeString()
    });
  }

  if (statusPengaduanFilter) {
    statusPengaduanFilter.addEventListener('change', (e) => {
      const selectedStatus = e.target.value;
      const statusText = selectedStatus ? getStatusText(selectedStatus) : 'Semua Pengaduan';
      
      console.log('Status Pengaduan Selection:', {
        previous: eventManager.getComplaintStatusFilter(),
        new: selectedStatus,
        statusText: statusText,
        timestamp: new Date().toLocaleTimeString()
      });
      
      applyComplaintFilter();
    });
  }

  const pengaduanCheckbox = document.getElementById('monitoring_pengaduan');
  if (pengaduanCheckbox) {
    pengaduanCheckbox.addEventListener('change', (e) => {
      console.log('Complaint layer toggled:', {
        checked: e.target.checked,
        currentStatus: statusPengaduanFilter?.value
      });
      if (e.target.checked) {
        applyComplaintFilter();
      } else {
        map.removeLayer(layers.monitoring_pengaduan);
      }
    });
  }

  if (pengaduanCheckbox && pengaduanCheckbox.checked) {
    console.log('Initializing complaint filter');
    applyComplaintFilter();
  }
}

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

// Single export block at the bottom
export {
  setupStatusFilter,
  setupPipaSumbermaControls,
  setupComplaintFilter
};

