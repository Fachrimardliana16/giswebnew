/**
 * Filter domain PENGADUAN (layer monitoring_pengaduan).
 */

import { versiFilter } from '../config.js';
import { cqlPengaduan } from '../cql.js';
import { zoomKeHasilFilter, kosongkanTile } from '../autoZoom.js';

export function setupFilterPengaduan(map, layers) {
  const status = document.getElementById('statusPengaduanFilter');
  const tahun = document.getElementById('pengaduanTahunFilter');
  const checkbox = document.getElementById('monitoring_pengaduan');

  const terapkan = () => {
    if (!checkbox || !checkbox.checked) {
      if (typeof layers.__sudahDibuat === 'function' && layers.__sudahDibuat('monitoring_pengaduan')) {
        if (map.hasLayer(layers.monitoring_pengaduan)) map.removeLayer(layers.monitoring_pengaduan);
      }
      return;
    }

    const layer = layers.monitoring_pengaduan;
    if (!layer) return;

    const cql = cqlPengaduan({ status: status?.value, tahun: tahun?.value });
    const v = versiFilter(cql);

    if (layer.wmsParams._v !== v) {
      // Tile lama dibuang dulu: jangan minta tile ber-filter di area lama.
      kosongkanTile(layer);
      layer.setParams({ cql_filter: cql, _v: v });
      // --- FITUR BARU: zoom ke sebaran data hasil filter ---
      zoomKeHasilFilter(map, layers, ['monitoring_pengaduan']);
      // --- AKHIR FITUR BARU ---
    }
    if (!map.hasLayer(layer)) layer.addTo(map);
  };

  [status, tahun].forEach(el => el?.addEventListener('change', terapkan));
  checkbox?.addEventListener('change', () => {
    terapkan();
    // --- FITUR BARU: layer baru dicentang -> zoom ke sebarannya ---
    if (checkbox?.checked) {
      zoomKeHasilFilter(map, layers, ['monitoring_pengaduan'], true);
    }
    // --- AKHIR FITUR BARU ---
  });
}
