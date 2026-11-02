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
