/**
 * Filter domain PELANGGAN (layer analisa_pelanggan).
 */

import { versiFilter } from '../config.js';
import { cqlPelanggan } from '../cql.js';
// --- FITUR BARU ---
import { zoomKeHasilFilter, redupkanTile } from '../autoZoom.js';

const ID_FILTER = [
  'statusFilter', 'cabangFilter', 'tarifFilter', 'kubikasiFilter',
  'tunggakanFilter', 'umurWMFilter',
  // --- FITUR BARU ---
  'isvalidFilter', 'lunasFilter',
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
    // --- FITUR BARU ---
    isvalid: el.isvalidFilter?.value,
    lunas: el.lunasFilter?.value,
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

    // 'Baru dicentang' = layer belum tampil di peta ATAU filter belum pernah
    // diterapkan pada layer ini. Memakai map.hasLayer saja tidak cukup:
    // layer bisa sudah terpasang dari sesi sebelumnya.
    const belumPernahDifilter = layer.wmsParams._v === undefined;
    const pertamaKali = !map.hasLayer(layer) || belumPernahDifilter;
    if (!map.hasLayer(layer)) layer.addTo(map);

    const cql = cqlPelanggan(bacaNilai());
    const v = versiFilter(cql);

    // Filter sama DAN layer sudah tampil -> jangan sentuh.
    //
    // Syarat 'sudah tampil' penting: saat layer BARU dicentang dengan filter
    // kosong, _v sudah sama dengan sebelumnya sehingga dulu fungsi ini
    // berhenti di sini — peta tidak pernah digeser ke sebaran datanya.
    if (!pertamaKali && layer.wmsParams._v === v) return;

    // Redupkan tile lama (bukan dikosongkan) supaya peta tidak pernah
    // kosong selama transisi.
    redupkanTile(layer);

    layer.setParams({ cql_filter: cql, _v: v });

    // --- FITUR BARU: zoom ke sebaran data hasil filter ---
    // Satu-satunya jalur zoom untuk layer ini.
    // izinkanTanpaFilter = true hanya saat layer baru dicentang: waktu itu
    // belum tentu ada filter, dan pengguna memang ingin melihat datanya.
    zoomKeHasilFilter(map, layers, ['analisa_pelanggan'], pertamaKali);
    // --- AKHIR FITUR BARU ---
  };

  let timer;
  const tunda = () => {
    clearTimeout(timer);
    timer = setTimeout(terapkan, 300);
  };

  ID_FILTER.forEach(id => el[id]?.addEventListener('change', tunda));
  el.checkbox?.addEventListener('change', () => {
    // CUKUP satu jalur zoom.
    //
    // Sebelumnya di sini dipanggil terapkan() DAN zoomKeHasilFilter()
    // sekaligus, sehingga dua permintaan zoom berjalan bersamaan dengan
    // extent berbeda dan saling menimpa: peta zoom in lalu zoom out lagi.
    // Sekarang terapkan() yang menangani zoom (lihat di bawah).
    terapkan();
  });
  el.rayonBtn?.addEventListener('click', tunda);
  el.caterBtn?.addEventListener('click', tunda);

  terapkan();
}
