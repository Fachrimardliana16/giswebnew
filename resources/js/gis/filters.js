import { eventManager } from './eventManager.js';
import { formatRayonFilter } from './helpers.js';

/**
 * Setup customer status filtering
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export function setupStatusFilter(map, layers) {
  const statusFilter = document.getElementById('statusFilter');
  const cabangFilter = document.getElementById('cabangFilter');
  const tarifFilter = document.getElementById('tarifFilter');
  const kubikasiFilter = document.getElementById('kubikasiFilter');
  const tunggakanFilter = document.getElementById('tunggakanFilter');
  const umurWMFilter = document.getElementById('umurWMFilter');
  const caterInput = document.getElementById('caterSearchInput');
  const rayonInput = document.getElementById('rayonSearchInput');
  const pelangganCheckbox = document.querySelector('.pelanggan-checkbox');

  /**
   * Build CQL filter based on selected filters
   */
  function buildCQLFilter() {
    const conditions = [];

    if (statusFilter && statusFilter.value) {
      conditions.push(`status='${statusFilter.value}'`);
    }

    if (cabangFilter && cabangFilter.value) {
      conditions.push(`cabang='${cabangFilter.value}'`);
    }

    if (tarifFilter && tarifFilter.value) {
      conditions.push(`tarif='${tarifFilter.value}'`);
    }

    if (kubikasiFilter && kubikasiFilter.value) {
      const val = kubikasiFilter.value;
      if (val === '0') {
        conditions.push(`drd_pemakaian = 0`);
      } else if (val === '>30') {
        conditions.push(`drd_pemakaian > 30`);
      } else {
        const parts = val.split('-');
        if (parts.length === 2) {
          conditions.push(`drd_pemakaian >= ${parts[0]} AND drd_pemakaian <= ${parts[1]}`);
        }
      }
    }

    if (tunggakanFilter && tunggakanFilter.value) {
      const val = tunggakanFilter.value;
      if (val === '>7') {
        conditions.push(`tungg_lembar > 7`);
      } else {
        conditions.push(`tungg_lembar = ${val}`);
      }
    }

    if (umurWMFilter && umurWMFilter.value) {
      const val = umurWMFilter.value;
      if (val === 'none') {
        conditions.push(`(umurwm_tahun IS NULL OR umurwm_tahun <= 0)`);
      } else if (val === '0') {
        conditions.push(`umurwm_tahun = 0`);
      } else {
        const parts = val.split('-');
        if (parts.length === 2) {
          conditions.push(`umurwm_tahun >= ${parts[0]} AND umurwm_tahun <= ${parts[1]}`);
        }
      }
    }

    if (caterInput && caterInput.value.trim()) {
      const caterValue = caterInput.value.trim();
      conditions.push(`bacameter_namacater LIKE '%${caterValue.toUpperCase()}%'`);
    }

    if (rayonInput && rayonInput.value.trim()) {
      const rayonValue = rayonInput.value.trim();
      const formattedRayon = formatRayonFilter(rayonValue);
      conditions.push(`nolang LIKE '${formattedRayon}%'`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  function applyFilter() {
    if (!layers || !layers.analisa_pelanggan) return;

    const isCustomerLayerActive = pelangganCheckbox && pelangganCheckbox.checked;

    if (isCustomerLayerActive) {
      if (!map.hasLayer(layers.analisa_pelanggan)) {
        layers.analisa_pelanggan.addTo(map);
      }
      
      const cqlFilter = buildCQLFilter();
      layers.analisa_pelanggan.setParams({
        cql_filter: cqlFilter,
        random: Math.random()
      });
    } else {
      if (map.hasLayer(layers.analisa_pelanggan)) {
        map.removeLayer(layers.analisa_pelanggan);
      }
    }
  }

  let filterTimeout;
  const handleFilterChange = () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      applyFilter();
    }, 300);
  };

  // Listeners
  [statusFilter, cabangFilter, tarifFilter, kubikasiFilter, tunggakanFilter, umurWMFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', handleFilterChange);
  });

  if (pelangganCheckbox) {
    pelangganCheckbox.addEventListener('change', applyFilter);
  }

  const rayonSearchBtn = document.getElementById('applyRayonFilter');
  if (rayonSearchBtn) {
    rayonSearchBtn.addEventListener('click', handleFilterChange);
  }

  const caterSearchBtn = document.getElementById('applyCaterFilter');
  if (caterSearchBtn) {
    caterSearchBtn.addEventListener('click', handleFilterChange);
  }

  // Initial
  applyFilter();
}

/**
 * Setup pipe source and global filters (Material, Network, Unit)
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export function setupPipaFilters(map, layers) {
  const jenisFilter = document.getElementById('pipaJenisFilter');
  const jaringanFilter = document.getElementById('pipaJaringanFilter');
  const unitFilter = document.getElementById('pipaUnitFilter');
  const pipeCheckboxes = document.querySelectorAll('.pipa-checkbox');

  function buildGlobalPipeCQL() {
    const conditions = [];
    if (jenisFilter && jenisFilter.value) {
      conditions.push(`jenis='${jenisFilter.value}'`);
    }
    if (jaringanFilter && jaringanFilter.value) {
      const val = jaringanFilter.value;
      if (val === 'Tansmisi') {
        conditions.push(`(jnsjringan='Tansmisi' OR jnsjringan='Transmisi')`);
      } else if (val === 'Tersier') {
        conditions.push(`(jnsjringan LIKE 'Tersier' OR jnsjringan LIKE 'Tertier' OR jnsjringan LIKE 'tersier' OR jnsjringan LIKE 'tertier%')`);
      } else {
        conditions.push(`jnsjringan='${val}'`);
      }
    }
    if (unitFilter && unitFilter.value) {
      conditions.push(`unitikk='${unitFilter.value}'`);
    }
    return conditions.length > 0 ? conditions.join(' AND ') : null;
  }

  function applyPipeFilters() {
    const globalCQL = buildGlobalPipeCQL();
    
    // Update all diameter layers
    Object.keys(layers).forEach(id => {
      if (id.startsWith('pipa') && !id.includes('Reservoar') && !id.includes('MA')) {
        const layer = layers[id];
        const diameter = id.replace('pipa', '');
        
        let finalFilter = `diameter=${diameter}`;
        if (globalCQL) {
          finalFilter += ` AND ${globalCQL}`;
        }

        layer.setParams({
          cql_filter: finalFilter,
          random: Math.random()
        });
      }
    });
  }

  // Listeners for global dropdowns
  [jenisFilter, jaringanFilter, unitFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', applyPipeFilters);
  });

  // Listeners for layer toggles
  document.querySelectorAll('.pipa-checkbox, .pipa-sumberma-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const layerId = e.target.id;
      const layer = layers[layerId];

      if (!layer) return;

      if (e.target.checked) {
        // If it's a diameter layer, ensure global filters are applied
        if (layerId.startsWith('pipa') && !layerId.includes('Reservoar') && !layerId.includes('MA')) {
          applyPipeFilters();
        }
        layer.addTo(map);
      } else {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      }
    });
  });
}

/**
 * Setup complaint status and year filtering
 */
export function setupComplaintFilter(map, layers) {
  const statusPengaduanFilter = document.getElementById('statusPengaduanFilter');
  const tahunPengaduanFilter = document.getElementById('pengaduanTahunFilter');
  const pengaduanCheckbox = document.getElementById('monitoring_pengaduan');

  function applyComplaintFilter() {
    if (!layers.monitoring_pengaduan || !pengaduanCheckbox || !pengaduanCheckbox.checked) return;

    const conditions = [];
    
    // Status Filter (using compliantstatusid)
    if (statusPengaduanFilter && statusPengaduanFilter.value) {
      conditions.push(`compliantstatusid=${statusPengaduanFilter.value}`);
    }

    // Year Filter (using datecompliant)
    if (tahunPengaduanFilter && tahunPengaduanFilter.value) {
      const year = tahunPengaduanFilter.value;
      conditions.push(`datecompliant >= '${year}-01-01T00:00:00Z' AND datecompliant <= '${year}-12-31T23:59:59Z'`);
    }

    const cqlFilter = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    layers.monitoring_pengaduan.setParams({
      cql_filter: cqlFilter,
      random: Math.random()
    });
    
    if (!map.hasLayer(layers.monitoring_pengaduan)) {
      layers.monitoring_pengaduan.addTo(map);
    }
  }

  [statusPengaduanFilter, tahunPengaduanFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', applyComplaintFilter);
  });

  if (pengaduanCheckbox) {
    pengaduanCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        applyComplaintFilter();
      } else {
        if (map.hasLayer(layers.monitoring_pengaduan)) {
          map.removeLayer(layers.monitoring_pengaduan);
        }
      }
    });
  }
}

/**
 * Initialize all filters
 */
export function initFilters(map, layers) {
    setupStatusFilter(map, layers);
    setupPipaFilters(map, layers);
    setupComplaintFilter(map, layers);
}
