/**
 * Filter domain PELANGGAN (layer analisa_pelanggan).
 */

import { versiFilter } from '../config.js';
import { cqlPelanggan } from '../cql.js';

const ID_FILTER = [
  'statusFilter', 'cabangFilter', 'tarifFilter', 'kubikasiFilter',
  'tunggakanFilter', 'umurWMFilter',
];

export function setupFilterPelanggan(map, layers) {
  const el = {};
  ID_FILTER.forEach(id => { el[id] = document.getElementById(id); });
  el.cater = document.getElementById('caterSearchInput');
  el.rayon = document.getElementById('rayonSearchInput');
  el.caterBtn = document.getElementById('applyCaterFilter');
  el.rayonBtn = document.getElementById('applyRayonFilter');
  el.checkbox = document.querySelector('.pelanggan-checkbox');

  const bacaNilai = () => ({
    status: el.statusFilter?.value,
    cabang: el.cabangFilter?.value,
    tarif: el.tarifFilter?.value,
    kubikasi: el.kubikasiFilter?.value,
    tunggakan: el.tunggakanFilter?.value,
    umurWM: el.umurWMFilter?.value,
    cater: el.cater?.value,
    rayon: el.rayon?.value,
  });

  const terapkan = () => {
    // Lazy layer: jangan buat layer kalau checkbox tidak aktif
    if (!el.checkbox || !el.checkbox.checked) {
      if (typeof layers.__sudahDibuat === 'function' && layers.__sudahDibuat('analisa_pelanggan')) {
        if (map.hasLayer(layers.analisa_pelanggan)) map.removeLayer(layers.analisa_pelanggan);
      }
      return;
    }

    const layer = layers.analisa_pelanggan;
    if (!layer) return;

    if (!map.hasLayer(layer)) layer.addTo(map);

    const cql = cqlPelanggan(bacaNilai());
    const v = versiFilter(cql);

    // Filter sama -> jangan sentuh, hindari render ulang tile
    if (layer.wmsParams._v === v) return;

    layer.setParams({ cql_filter: cql, _v: v });
  };

  let timer;
  const tunda = () => {
    clearTimeout(timer);
    timer = setTimeout(terapkan, 300);
  };

  ID_FILTER.forEach(id => el[id]?.addEventListener('change', tunda));
  el.checkbox?.addEventListener('change', terapkan);
  el.rayonBtn?.addEventListener('click', tunda);
  el.caterBtn?.addEventListener('click', tunda);

  terapkan();
}
