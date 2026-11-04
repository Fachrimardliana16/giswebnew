/**
 * Filter domain AKSESORIS (13 layer all_*).
 *
 * Satu panel filter berlaku untuk SEMUA layer aksesoris sekaligus:
 *  - Kondisi   (baik / rusak / tertimbun / kosong)
 *  - Diameter  (25/40/50/75/100/150/200/250 mm)
 *  - isValid   (valid / tidak valid)
 *
 * Catatan penting soal data sumber:
 *  - Nama kolom kondisi tidak seragam; gatevalve memakai 'kodisi' (salah
 *    tulis di data asli). Pemetaan ada di cql.js (KOLOM_AKSESORIS).
 *  - Nilai kondisi ditulis tidak konsisten (BAIK/Baik/baik/bagus/...),
 *    sehingga filternya memakai ILIKE, bukan perbandingan persis.
 *  - Layer bersifat lazy: hanya layer yang checkbox-nya dicentang yang
 *    dibuat dan diberi filter. Yang belum dicentang tidak disentuh.
 */

// --- FITUR BARU ---
import { versiFilter } from '../config.js';
import { cqlAksesoris } from '../cql.js';
import { zoomKeHasilFilter, kosongkanTile } from '../autoZoom.js';

const ID_KONDISI = 'aksesorisKondisiFilter';
const ID_DIAMETER = 'aksesorisDiameterFilter';
const ID_ISVALID = 'aksesorisIsvalidFilter';

export function setupFilterAksesoris(map, layers) {
  const elKondisi = document.getElementById(ID_KONDISI);
  const elDiameter = document.getElementById(ID_DIAMETER);
  const elIsvalid = document.getElementById(ID_ISVALID);

  const bacaNilai = () => ({
    kondisi: elKondisi?.value,
    diameter: elDiameter?.value,
    isvalid: elIsvalid?.value,
  });

  /**
   * Terapkan filter ke semua layer aksesoris yang sedang aktif.
   *
   * Filter diterapkan lewat cql_filter. Kalau tidak ada filter sama sekali,
   * cql_filter DIHAPUS (bukan diisi '1=1') supaya tile kembali memakai
   * cache normal GeoServer.
   */
  const terapkan = () => {
    const nilai = bacaNilai();

    document.querySelectorAll('.aksesoris-checkbox').forEach((checkbox) => {
      const layerId = checkbox.id;

      // Layer belum dibuat -> tidak ada yang perlu difilter.
      // (Lazy: layer baru dibuat saat dicentang / saat filter diterapkan.)
      if (typeof layers.__sudahDibuat === 'function' && !layers.__sudahDibuat(layerId)) {
        return;
      }

      const layer = layers[layerId];
      if (!layer) return;

      const cql = cqlAksesoris(layerId, nilai);
      const v = versiFilter(cql || 'tanpa-filter');

      // Filter sama -> jangan sentuh, hindari render ulang tile
      if (layer.wmsParams._v === v) return;

      const params = { _v: v };
      if (cql) {
        params.cql_filter = cql;
      } else {
        // hapus filter lama; GeoServer memperlakukan string kosong sebagai
        // "tanpa filter", jadi kembalikan ke kondisi awal.
        params.cql_filter = '';
      }

      // Tile lama dibuang dulu: jangan minta tile ber-filter di area lama.
      kosongkanTile(layer);
      layer.setParams(params);
    });

    // --- FITUR BARU: zoom ke sebaran data hasil filter ---
    // Layer aksesoris adalah titik, jadi extent-nya bisa dihitung dari WFS.
    zoomKeHasilFilter(map, layers, Array.from(document.querySelectorAll('.aksesoris-checkbox'))
      .filter(c => c.checked).map(c => c.id));
    // --- AKHIR FITUR BARU ---
  };

  let timer;
  const tunda = () => {
    clearTimeout(timer);
    timer = setTimeout(terapkan, 300);
  };

  [elKondisi, elDiameter, elIsvalid].forEach((el) => {
    el?.addEventListener('change', tunda);
  });

  // Saat sebuah layer aksesoris baru dicentang, filter yang sudah dipilih
  // harus langsung ikut terpasang (bukan menunggu user mengubah dropdown lagi).
  document.querySelectorAll('.aksesoris-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (!checkbox.checked) return;
      tunda();
      // --- FITUR BARU: layer baru dicentang -> zoom ke sebarannya ---
      zoomKeHasilFilter(map, layers, [checkbox.id], true);
      // --- AKHIR FITUR BARU ---
    });
  });

  terapkan();
}
// --- AKHIR FITUR BARU ---
