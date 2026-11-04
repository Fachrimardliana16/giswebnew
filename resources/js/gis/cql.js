/**
 * Pembangun ekspresi CQL — murni, tanpa DOM.
 *
 * Dipisahkan dari modul filter agar bisa diuji dan dipakai ulang.
 * Setiap fungsi menerima nilai mentah dan mengembalikan potongan CQL,
 * atau `null` bila tidak ada kondisi.
 */

import { formatRayonFilter } from './helpers.js';

/** Escape kutip tunggal sesuai aturan CQL. */
export const esc = (v) => String(v).replace(/'/g, "''");

/**
 * Filter pelanggan (layer analisa_pelanggan).
 *
 * @param {Object} v nilai filter
 * @returns {string} CQL, '1=1' bila kosong
 */
export function cqlPelanggan(v = {}) {
  const c = [];

  if (v.status) c.push(`status='${esc(v.status)}'`);
  if (v.cabang) c.push(`cabang='${esc(v.cabang)}'`);
  if (v.tarif) c.push(`tarif='${esc(v.tarif)}'`);

  // --- FITUR BARU: isvalid + lunas/belum lunas ---
  // isvalid bertipe boolean di GeoServer: pakai true/false tanpa kutip.
  if (v.isvalid === 'true') c.push('isvalid = true');
  if (v.isvalid === 'false') c.push('isvalid = false');

  // Status pelunasan memakai tgllunas (kolom date).
  //   'belum' -> tagihan masih berjalan, tgllunas kosong  -> 4.948 pelanggan
  //   'lunas' -> sudah ada tanggal lunas                  -> 60.746 pelanggan
  // Angka diambil dari numberMatched GeoServer, bukan perkiraan.
  if (v.lunas === 'belum') c.push('tgllunas IS NULL');
  if (v.lunas === 'lunas') c.push('tgllunas IS NOT NULL');
  // --- AKHIR FITUR BARU ---

  if (v.kubikasi) {
    if (v.kubikasi === '0') {
      c.push('drd_pemakaian = 0');
    } else if (v.kubikasi === '>30') {
      c.push('drd_pemakaian > 30');
    } else {
      const p = String(v.kubikasi).split('-');
      if (p.length === 2) c.push(`drd_pemakaian >= ${p[0]} AND drd_pemakaian <= ${p[1]}`);
    }
  }

  if (v.tunggakan) {
    c.push(v.tunggakan === '>7' ? 'tungg_lembar > 7' : `tungg_lembar = ${v.tunggakan}`);
  }

  if (v.umurWM) {
    if (v.umurWM === 'none') {
      c.push('(umurwm_tahun IS NULL OR umurwm_tahun <= 0)');
    } else if (v.umurWM === '0') {
      c.push('umurwm_tahun = 0');
    } else {
      const p = String(v.umurWM).split('-');
      if (p.length === 2) c.push(`umurwm_tahun >= ${p[0]} AND umurwm_tahun <= ${p[1]}`);
    }
  }

  if (v.cater && String(v.cater).trim()) {
    c.push(`bacameter_namacater LIKE '%${esc(String(v.cater).trim().toUpperCase())}%'`);
  }

  if (v.rayon && String(v.rayon).trim()) {
    c.push(`nolang LIKE '${esc(formatRayonFilter(String(v.rayon).trim()))}%'`);
  }

  return c.length ? c.join(' AND ') : '1=1';
}

/**
 * Filter jaringan pipa (layer web_pipa).
 *
 * @param {Object} v { jenis, jaringan, unit, diameter: string[], sumber: string[] }
 * @returns {string|null} CQL, null bila tidak ada filter sama sekali
 */
export function cqlPipa(v = {}) {
  const global = [];

  if (v.jenis) global.push(`jenis='${esc(v.jenis)}'`);

  if (v.jaringan) {
    if (v.jaringan === 'Tansmisi') {
      global.push("(jnsjringan='Tansmisi' OR jnsjringan='Transmisi')");
    } else if (v.jaringan === 'Tersier') {
      global.push("(jnsjringan LIKE 'Tersier' OR jnsjringan LIKE 'Tertier' OR jnsjringan LIKE 'tersier' OR jnsjringan LIKE 'tertier%')");
    } else {
      global.push(`jnsjringan='${esc(v.jaringan)}'`);
    }
  }

  if (v.unit) global.push(`unitikk LIKE '%${esc(v.unit)}%'`);

  // Diameter hanya menerima angka — cegah ekspresi aneh masuk ke CQL
  const diameter = (v.diameter || [])
    .map(d => String(d).replace(/[^0-9]/g, ''))
    .filter(Boolean);
  if (diameter.length) global.push(`diameter IN (${diameter.join(',')})`);

  const sumber = (v.sumber || [])
    .map(s => String(s).toLowerCase().trim())
    .filter(Boolean)
    .map(s => `strToLowerCase(sumberma) LIKE '%${esc(s)}%'`);
  if (sumber.length) global.push(`(${sumber.join(' OR ')})`);

  return global.length ? global.join(' AND ') : null;
}

/**
 * Filter pengaduan (layer monitoring_pengaduan).
 */
export function cqlPengaduan(v = {}) {
  const c = [];

  // status harus angka
  if (v.status && /^[0-9]+$/.test(String(v.status))) {
    c.push(`compliantstatusid=${v.status}`);
  }

  // tahun harus 4 digit
  if (v.tahun && /^[0-9]{4}$/.test(String(v.tahun))) {
    c.push(`datecompliant >= '${v.tahun}-01-01T00:00:00Z' AND datecompliant <= '${v.tahun}-12-31T23:59:59Z'`);
  }

  return c.length ? c.join(' AND ') : '1=1';
}

// --- FITUR BARU: filter aksesoris (kondisi / diameter / isvalid) ---
/**
 * Nama kolom aksesoris TIDAK seragam di sumber data. Dicek satu per satu
 * lewat DescribeFeatureType, bukan diasumsikan:
 *   all_gatevalve  : 'kodisi' (salah tulis di data asli) + 'dia'
 *   all_airvalve   : 'kondisi' + 'dia'
 *   all_washout    : 'kondisi' + 'dia'
 *   all_firehydrant: 'kondisi' + 'diameter'
 *   all_meterinduk : 'diameter' (tidak punya kolom kondisi)
 * Layer yang tidak disebut memakai default 'kondisi' + 'dia'.
 */
const KOLOM_AKSESORIS = {
  all_gatevalve: { kondisi: 'kodisi', diameter: 'dia' },
  all_airvalve: { kondisi: 'kondisi', diameter: 'dia' },
  all_checkvalve: { kondisi: 'kondisi', diameter: 'dia' },
  all_bend: { kondisi: 'kondisi', diameter: 'dia' },
  all_dop: { kondisi: 'kondisi', diameter: 'dia' },
  all_firehydrant: { kondisi: 'kondisi', diameter: 'diameter' },
  all_meterinduk: { kondisi: null, diameter: 'diameter' },
  all_prv: { kondisi: 'kondisi', diameter: 'dia' },
  all_reducer: { kondisi: 'kondisi', diameter: 'dia' },
  all_strainer: { kondisi: 'kondisi', diameter: 'dia' },
  all_tee: { kondisi: 'kondisi', diameter: 'dia' },
  all_titik_tekanan: { kondisi: 'kondisi', diameter: 'dia' },
  all_washout: { kondisi: 'kondisi', diameter: 'dia' },
};

/**
 * Nilai kondisi di lapangan kotor: 'BAIK', 'Baik', 'baik', 'bagus', 'Bagus',
 * 'BAIK ' (spasi ekor), 'TERTIMBUN'/'TERTIMBIUN'/'TERTIMBUN ' (salah tulis),
 * 'RUSAK ', 'Baru', 'Berfungsi', bahkan 'true'.
 *
 * Karena itu TIDAK boleh pakai perbandingan persis: `kodisi='BAIK'` hanya
 * menjaring 12 baris padahal yang sebenarnya "baik" ada 249-288 baris —
 * 95% data akan hilang dari peta tanpa tanda apa pun.
 *
 * `strToLowerCase()`/`trim()` DITOLAK GeoServer (HTTP 400), jadi satu-satunya
 * cara yang terbukti jalan adalah ILIKE dengan pola awalan.
 */
const POLA_KONDISI = {
  baik: ['baik%', 'bagus%', 'baru%', 'berfungsi%', 'true'],
  rusak: ['rusak%'],
  tertimbun: ['tertimb%'],
};

/**
 * Filter bersama untuk semua layer aksesoris.
 *
 * @param {string} layerId
 * @param {Object} v { kondisi, diameter, isvalid }
 * @returns {string|null} CQL, atau null bila tidak ada filter
 */
export function cqlAksesoris(layerId, v = {}) {
  const kolom = KOLOM_AKSESORIS[layerId] || { kondisi: 'kondisi', diameter: 'dia' };
  const c = [];

  // --- kondisi (ILIKE, tahan terhadap variasi penulisan) ---
  if (v.kondisi && kolom.kondisi) {
    if (v.kondisi === 'kosong') {
      c.push(`${kolom.kondisi} IS NULL`);
    } else {
      const pola = POLA_KONDISI[v.kondisi];
      if (pola) {
        const bagian = pola.map(p => (p === 'true'
          ? `${kolom.kondisi} ILIKE 'true'`
          : `${kolom.kondisi} ILIKE '${p}'`));
        c.push(`(${bagian.join(' OR ')})`);
      }
    }
  }

  // --- diameter: hanya angka, cegah ekspresi aneh masuk CQL ---
  if (v.diameter && kolom.diameter) {
    const d = String(v.diameter).replace(/[^0-9]/g, '');
    if (d) c.push(`${kolom.diameter} = ${d}`);
  }

  // --- isvalid boolean ---
  if (v.isvalid === 'true') c.push('isvalid = true');
  if (v.isvalid === 'false') c.push('isvalid = false');

  return c.length ? c.join(' AND ') : null;
}
// --- AKHIR FITUR BARU ---
