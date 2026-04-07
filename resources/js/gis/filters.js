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
    
    // 1. Handle Pipe Diameters (Consolidated)
    const checkedDiameters = Array.from(document.querySelectorAll('.pipa-checkbox:checked'))
      .map(cb => cb.id.replace('pipa', ''));
    
    if (checkedDiameters.length > 0) {
      let diameterCQL = `diameter IN (${checkedDiameters.join(',')})`;
      if (globalCQL) diameterCQL += ` AND ${globalCQL}`;
      
      layers.web_pipa.setParams({ cql_filter: diameterCQL, random: Math.random() });
      if (!map.hasLayer(layers.web_pipa)) layers.web_pipa.addTo(map);
    } else {
      if (map.hasLayer(layers.web_pipa)) map.removeLayer(layers.web_pipa);
    }

    // 2. Handle Water Sources (Consolidated)
    const checkedSources = Array.from(document.querySelectorAll('.pipa-sumberma-checkbox:checked'))
      .map(cb => {
        // Map checkbox ID back to source name (This is a bit fragile if names change)
        const label = cb.parentElement.querySelector('label')?.textContent.trim();
        return `'${label}'`;
      });
    
    if (checkedSources.length > 0) {
      let sourceCQL = `sumberma IN (${checkedSources.join(',')})`;
      if (globalCQL) sourceCQL += ` AND ${globalCQL}`;
      
      layers.web_pipa_sumberma.setParams({ cql_filter: sourceCQL, random: Math.random() });
      if (!map.hasLayer(layers.web_pipa_sumberma)) layers.web_pipa_sumberma.addTo(map);
    } else {
      if (map.hasLayer(layers.web_pipa_sumberma)) map.removeLayer(layers.web_pipa_sumberma);
    }
  }

  // Listeners for global dropdowns
  [jenisFilter, jaringanFilter, unitFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', applyPipeFilters);
  });

  // Listeners for ALL pipe-related checkboxes
  document.querySelectorAll('.pipa-checkbox, .pipa-sumberma-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      // Toggle label visual state
      const label = e.target.parentElement.querySelector('label');
      if (label) {
        if (e.target.checked) label.classList.add('text-blue-600', 'font-black');
        else label.classList.remove('text-blue-600', 'font-black');
      }
      
      applyPipeFilters();
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
