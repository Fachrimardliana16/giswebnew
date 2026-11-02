/**
 * Filter domain PENGADUAN (layer monitoring_pengaduan).
 */

import { versiFilter } from '../config.js';
import { cqlPengaduan } from '../cql.js';

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
      layer.setParams({ cql_filter: cql, _v: v });
    }
    if (!map.hasLayer(layer)) layer.addTo(map);
  };

  [status, tahun].forEach(el => el?.addEventListener('change', terapkan));
  checkbox?.addEventListener('change', terapkan);
}
