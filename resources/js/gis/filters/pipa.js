/**
 * Filter domain JARINGAN PIPA (layer web_pipa).
 *
 * Layer ini menggabungkan diameter pipa, sumber air, dan filter global
 * (material / jenis jaringan / unit IKK) dalam SATU layer WMS.
 */

import { versiFilter } from '../config.js';
import { cqlPipa } from '../cql.js';
import { zoomKeHasilFilter, kosongkanTile } from '../autoZoom.js';

export function setupFilterPipa(map, layers) {
  const jenis = document.getElementById('pipaJenisFilter');
  const jaringan = document.getElementById('pipaJaringanFilter');
  const unit = document.getElementById('pipaUnitFilter');

  const bacaNilai = () => ({
    jenis: jenis?.value,
    jaringan: jaringan?.value,
    unit: unit?.value,
    diameter: Array.from(document.querySelectorAll('.pipa-checkbox:checked'))
      .map(cb => cb.id.replace('pipa', '')),
    sumber: Array.from(document.querySelectorAll('.pipa-sumberma-checkbox:checked'))
      .map(cb => cb.dataset.value || ''),
  });

  const terapkan = () => {
    const cql = cqlPipa(bacaNilai());

    // Tidak ada filter sama sekali -> sembunyikan layer (dan jangan buat layer)
    if (!cql) {
      if (typeof layers.__sudahDibuat === 'function' && layers.__sudahDibuat('web_pipa')) {
        if (map.hasLayer(layers.web_pipa)) map.removeLayer(layers.web_pipa);
      }
      return;
    }

    const layer = layers.web_pipa;
    if (!layer) return;

    const v = versiFilter(cql);
    if (layer.wmsParams._v !== v) {
      // Tile lama dibuang dulu: jangan minta tile ber-filter di area lama.
      kosongkanTile(layer);
      layer.setParams({ cql_filter: cql, _v: v, tiled: true });
      // --- FITUR BARU: zoom ke sebaran pipa hasil filter ---
      // web_pipa adalah layer GARIS; autoZoom membaca vertex LineString.
      zoomKeHasilFilter(map, layers, ['web_pipa']);
      // --- AKHIR FITUR BARU ---
    }
    if (!map.hasLayer(layer)) layer.addTo(map);
  };

  [jenis, jaringan, unit].forEach(el => el?.addEventListener('change', terapkan));

  document.querySelectorAll('.pipa-checkbox, .pipa-sumberma-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      // umpan balik visual pada label
      const label = e.target.closest('.group')?.querySelector('label');
      if (label) {
        label.classList.toggle('text-blue-600', e.target.checked);
        label.classList.toggle('font-black', e.target.checked);
      }
      terapkan();
    });
  });

  terapkan();
}
