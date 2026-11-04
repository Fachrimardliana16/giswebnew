/**
 * Zoom otomatis ke sebaran data hasil filter.
 *
 * Masalah yang diselesaikan: setelah layer diaktifkan atau filter diubah,
 * peta tetap berada di viewport lama. Pengguna harus mencari sendiri di mana
 * data yang tersisa — padahal hasil filter bisa berada di satu kecamatan saja.
 *
 * CARA KERJA (dipilih dari pengukuran, bukan asumsi):
 *
 * Versi pertama meminta 5.000 geometri lewat WFS hanya untuk menghitung
 * min/max lon/lat. Itu memboroskan 0,9 MB dan butuh 20-36 detik untuk filter
 * `cabang` (kolom tidak terindeks di GeoServer).
 *
 * Sekarang dipakai WMS GetMap: GeoServer merender hasil filter ke gambar
 * kecil, lalu kita cari batas piksel yang berisi data. Terukur LEBIH CEPAT
 * dan muatannya jauh lebih ringan:
 *   semua data      WFS 2,61s / 0,9 MB   ->  WMS 3,17s / 8,9 KB
 *   filter Rembang  WFS 20,26s / 0,2 MB  ->  WMS 11,11s / 2,5 KB
 * Penyempitan berulang (3 putaran) membuat hasilnya jauh lebih akurat
 * daripada sampel: putaran berikutnya hanya merender kotak yang sudah
 * menyempit, jadi biayanya kecil.
 */

import { GEOSERVER_URL, MAP_BOUNDS } from './config.js';

// ms. Batas keseluruhan proses zoom. Filter `cabang` di GeoServer butuh
// ~11 detik per render karena kolomnya TIDAK terindeks; filter lain
// (status/isvalid/tgllunas/kondisi) hanya ~2-3 detik.
// AbortController tetap memutus kalau server benar-benar diam, dan selama
// menunggu pengguna tetap bisa menggeser peta sendiri.
const BATAS_WAKTU = 45000;

const RESOLUSI_AWAL = 256;     // render pertama: seluruh wilayah
const RESOLUSI_SEMPIT = 256;   // render penyempitan
const PUTARAN_MAKS = 3;        // penyempitan berulang
const ZOOM_MAKS = 17;          // jangan terlalu dekat kalau data menggerombol
const PADDING = 0.15;          // 15% ruang tepi

// Batas wilayah kerja, dipakai menyaring koordinat rusak di data.
const BATAS_PETA = MAP_BOUNDS;

/** Konversi derajat <-> Web Mercator (EPSG:3857). */
const ke3857 = (lon, lat) => [
  (lon * 20037508.34) / 180,
  (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * (20037508.34 / 180),
];
const lonDari3857 = (x) => (x * 180) / 20037508.34;
const latDari3857 = (y) => (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

/** Saring koordinat yang tidak masuk akal (ada data rusak di sumber). */
const koordinatWaras = (lon, lat) => (
  Number.isFinite(lon) && Number.isFinite(lat)
  && lon >= BATAS_PETA[0][1] && lon <= BATAS_PETA[1][1]
  && lat >= BATAS_PETA[0][0] && lat <= BATAS_PETA[1][0]
);

/** Baca PNG lewat canvas di browser. */
async function gambarKeData(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  const kanvas = document.createElement('canvas');
  kanvas.width = bmp.width;
  kanvas.height = bmp.height;
  const ctx = kanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  return { data: ctx.getImageData(0, 0, bmp.width, bmp.height), w: bmp.width, h: bmp.height };
}

/**
 * Kendali zoom hasil filter — SATU jalur, tidak boleh tumpang tindih.
 *
 * BUG YANG DIPERBAIKI: saat layer dicentang, zoom dipanggil DUA kali
 * (terapkan() dan handler checkbox langsung). Keduanya menghitung extent
 * lalu saling menimpa lewat fitBounds: peta sempat zoom in, lalu zoom out
 * lagi, disertai loading ulang tile — terlihat seperti bug acak.
 *
 * Sekarang hanya ada SATU permintaan zoom aktif. Permintaan baru
 * membatalkan yang lama, dan hasil yang sudah basi tidak boleh menggeser
 * peta.
 */
let permintaanZoom = 0;

export function batalkanZoom() {
  permintaanZoom++;
}

export function nomorZoomBaru() {
  permintaanZoom++;
  return permintaanZoom;
}

export function masihBerlaku(nomor) {
  return nomor === permintaanZoom;
}

/**
 * Satu putaran: render filter pada kotak `bbox` (EPSG:3857), kembalikan
 * kotak yang benar-benar berisi data (dalam derajat), atau null bila kosong.
 */
async function renderKotak(layerId, cql, bbox3857, signal, resolusi = RESOLUSI_AWAL) {
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: layerId.startsWith('webgis:') ? layerId : `webgis:${layerId}`,
    styles: '',
    format: 'image/png',
    transparent: 'true',
    tiled: 'true',
    width: String(resolusi),
    height: String(resolusi),
    srs: 'EPSG:3857',
    bbox: bbox3857.join(','),
  });
  if (cql) params.set('cql_filter', cql);

  const img = await gambarKeData(`${GEOSERVER_URL}?${params.toString()}`, signal);
  if (!img) return null;

  const { data, w, h } = img;
  const px = data.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // tile WMS transparan: pixel berisi data punya alpha > 10
      if (px[(y * w + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const [bx1, by1, bx2, by2] = bbox3857.map(Number);
  const dx = (bx2 - bx1) / w;
  const dy = (by2 - by1) / h;

  return {
    lonA: lonDari3857(bx1 + minX * dx),
    lonB: lonDari3857(bx1 + (maxX + 1) * dx),
    latA: latDari3857(by2 - (maxY + 1) * dy),
    latB: latDari3857(by2 - minY * dy),
    // kotak dalam 3857 untuk putaran berikutnya
    bbox3857: [bx1 + minX * dx, by2 - (maxY + 1) * dy, bx1 + (maxX + 1) * dx, by2 - minY * dy],
  };
}

/**
 * Hitung extent hasil filter untuk satu layer.
 *
 * Putaran 1 memakai seluruh wilayah kerja. Putaran berikutnya merender ulang
 * hanya kotak yang menyempit, sehingga satu titik liar di pinggir tidak
 * membesarkan kotak secara berlebihan.
 */
async function extentLayer(layerId, cql, signal) {
  const [x1, y1] = ke3857(BATAS_PETA[0][1], BATAS_PETA[0][0]);
  const [x2, y2] = ke3857(BATAS_PETA[1][1], BATAS_PETA[1][0]);

  let bbox = [x1, y1, x2, y2];
  let hasil = null;

  // Tanpa filter, hasilnya mencakup seluruh wilayah kerja: penyempitan
  // tidak menambah ketelitian, hanya menambah render. Cukup satu putaran.
  // Ini memotong waktu tunggu saat layer baru dicentang dari 3 render
  // menjadi 1 (terukur ~1,9s per render).
  const tanpaFilter = !cql || cql === '1=1';
  const putaran = tanpaFilter ? 1 : PUTARAN_MAKS;

  for (let i = 0; i < putaran; i++) {
    const r = await renderKotak(layerId, cql, bbox, signal,
      i === 0 ? RESOLUSI_AWAL : RESOLUSI_SEMPIT);
    if (!r) return hasil;          // tidak ada data pada kotak ini
    hasil = r;
    bbox = r.bbox3857;

    // kotak sudah sangat kecil: tidak perlu diulang
    const lebar = r.lonB - r.lonA;
    const tinggi = r.latB - r.latA;
    if (lebar < 0.0008 || tinggi < 0.0008) break;
  }

  if (!hasil) return null;
  // buang hasil di luar wilayah kerja (sisa koordinat rusak)
  if (!koordinatWaras(hasil.lonA, hasil.latA) || !koordinatWaras(hasil.lonB, hasil.latB)) {
    return null;
  }
  return hasil;
}

/**
 * Tile lama DIPERTAHANKAN. Hanya diburamkan sedikit selama transisi.
 *
 * Versi sebelumnya mengosongkan tile (`_tiles = {}` + innerHTML kosong)
 * supaya Leaflet tidak meminta tile ber-filter di area lama. Efek sampingnya
 * lebih buruk daripada manfaatnya: peta menjadi KOSONG selama beberapa detik
 * setiap kali filter diganti — pengguna melihat titik-titiknya hilang lalu
 * muncul lagi. Itu yang membuat fitur filter terasa berat dan bikin malas.
 *
 * Sekarang: tile lama tetap tampil (opacity diturunkan), peta digeser, tile
 * baru dimuat, lalu opacity dikembalikan. Pengguna selalu melihat sesuatu,
 * dan transisi terasa seperti penyegaran, bukan kehilangan data.
 *
 * Pemanggil WAJIB memulihkan opacity lewat pulihkanOpasitas().
 */
const OPASITAS_TRANSISI = 0.35;

export function redupkanTile(layer) {
  if (!layer || typeof layer.setOpacity !== 'function') return;
  try {
    layer.setOpacity(OPASITAS_TRANSISI);
  } catch (e) { /* diabaikan */ }
}

export function pulihkanOpasitas(layer) {
  if (!layer || typeof layer.setOpacity !== 'function') return;
  try {
    layer.setOpacity(1);
  } catch (e) { /* diabaikan */ }
}

// Dipertahankan untuk kompatibilitas pemanggil lama; kini hanya meredupkan.
export function kosongkanTile(layer) {
  redupkanTile(layer);
}

/**
 * Zoom peta ke sebaran data hasil filter.
 *
 * @param {Object} map instance Leaflet
 * @param {Object} layers direktori layer (Proxy lazy)
 * @param {Array<string>} layerIds layer yang sedang aktif
 * @param {boolean} izinkanTanpaFilter kalau true, layer tanpa filter tetap
 *        dihitung extent-nya (dipakai saat layer baru dicentang).
 * @returns {Promise<boolean>} true bila peta digeser
 */
export async function zoomKeHasilFilter(map, layers, layerIds, izinkanTanpaFilter = false) {
  if (!map || !Array.isArray(layerIds) || !layerIds.length) return false;

  const dipakai = layerIds.filter((id) => {
    if (!layers?.[id]) return false;
    const cql = layers[id]?.wmsParams?.cql_filter;
    const berfilter = cql && String(cql).trim() !== '' && String(cql).trim() !== '1=1';
    return berfilter || izinkanTanpaFilter;
  });
  if (!dipakai.length) return false;

  // Data lama TETAP TERLIHAT selama transisi (hanya diredupkan), supaya
  // peta tidak pernah kosong saat pengguna berganti filter.
  dipakai.forEach((id) => redupkanTile(layers[id]));

  // Ambil nomor urut: kalau ada permintaan zoom lain yang lebih baru
  // (pengguna cepat mengganti filter), hasil permintaan ini DIBUANG dan
  // tidak boleh menggeser peta. Tanpa ini, dua fitBounds saling menimpa
  // sehingga peta bisa zoom in lalu zoom out.
  const nomor = nomorZoomBaru();

  // PENTING — urutan yang benar:
  // Tile hasil filter diminta SEKARANG di posisi peta saat ini, TANPA
  // menunggu extent. Pengguna langsung melihat perubahan datanya (di area
  // yang sedang dipandang), lalu peta bergeser setelah extent siap.
  //
  // Sebelumnya tile baru diminta setelah fitBounds. Akibatnya untuk filter
  // lambat (`cabang` ~10 detik) pengguna menunggu dengan peta beku dan data
  // lama, lalu tiba-tiba melompat. Sekarang data muncul lebih dulu.
  dipakai.forEach((id) => layers[id]?.redraw?.());

  // Opacity dipulihkan begitu tile pertama selesai dimuat, bukan menunggu
  // seluruh proses zoom. Dengan begitu transisi terasa singkat.
  const pulihkanSegera = () => dipakai.forEach((id) => pulihkanOpasitas(layers[id]));
  const layerPertama = layers[dipakai[0]];
  if (layerPertama && typeof layerPertama.once === 'function') {
    layerPertama.once('load', pulihkanSegera);
  }
  // Jaring pengaman bila event 'load' tidak terpicu (mis. tidak ada tile
  // baru karena area sama): tetap pulihkan.
  setTimeout(pulihkanSegera, 6000);

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), BATAS_WAKTU) : null;

  try {
    const hasil = await Promise.all(
      dipakai.map((id) => {
        const cql = layers[id].wmsParams.cql_filter;
        const bersih = cql && String(cql).trim() !== '1=1' ? String(cql).trim() : '';
        return extentLayer(id, bersih, ctrl?.signal);
      })
    );

    let ext = null;
    hasil.filter(Boolean).forEach((e) => {
      ext = ext
        ? [Math.min(ext[0], e.lonA), Math.min(ext[1], e.latA), Math.max(ext[2], e.lonB), Math.max(ext[3], e.latB)]
        : [e.lonA, e.latA, e.lonB, e.latB];
    });

    // Extent tidak didapat: data sudah tampil di posisi sekarang, jadi
    // cukup pulihkan opacity. Jangan geser peta tanpa alasan.
    if (!ext || (ext[0] === ext[2] && ext[1] === ext[3])) {
      if (masihBerlaku(nomor)) {
        dipakai.forEach((id) => pulihkanOpasitas(layers[id]));
      }
      return false;
    }

    // TANPA FILTER: jangan geser peta.
    //
    // Terukur: saat layer baru dicentang tanpa filter, extent "semua data"
    // hasil render piksel bisa lebih lebar dari viewport pengguna sehingga
    // peta malah ZOOM OUT (11 -> 10,5). Pengguna yang baru mencentang layer
    // tidak sedang mencari area tertentu — biarkan peta di tempatnya dan
    // cukup tampilkan datanya.
    const semuaLayerTanpaFilter = dipakai.every((id) => {
      const c = layers[id]?.wmsParams?.cql_filter;
      return !c || String(c).trim() === '' || String(c).trim() === '1=1';
    });
    if (semuaLayerTanpaFilter) {
      if (masihBerlaku(nomor)) {
        dipakai.forEach((id) => pulihkanOpasitas(layers[id]));
      }
      return false;
    }

    // Ada permintaan zoom yang lebih baru -> buang hasil ini.
    if (!masihBerlaku(nomor)) {
      return false;
    }

    map.fitBounds(
      L.latLngBounds([ext[1], ext[0]], [ext[3], ext[2]]),
      { padding: [PADDING, PADDING], maxZoom: ZOOM_MAKS, animate: true, duration: 0.6 }
    );

    // Setelah peta di area baru, tile digambar ulang untuk wilayah sempit
    // (terukur: 2,2s per tile di area sempit vs 12-32s di area luas).
    map.once('moveend', () => {
      dipakai.forEach((id) => layers[id]?.redraw?.());
    });

    return true;
  } catch (e) {
    // AbortError (lewat batas waktu) dan gangguan jaringan: data sudah
    // tampil di posisi sekarang, cukup pulihkan opacity.
    dipakai.forEach((id) => pulihkanOpasitas(layers[id]));
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
