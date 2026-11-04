/**
 * Camera AR — geometri fitur untuk penempatan label.
 *
 * ATURAN: satu fitur = satu label.
 *
 * Sebelumnya label ditempatkan pada titik tengah SEGMEN terdekat. Karena satu
 * LineString bisa punya puluhan segmen, satu fitur menghasilkan banyak label
 * yang berderet sepanjang garis ("ERWAN…, ERWAN…, ERWAN…"). Selain itu,
 * label ikut berpindah-pindah mengikuti segmen mana yang kebetulan terdekat,
 * sehingga terasa seperti duplikasi.
 *
 * Modul ini menyediakan satu titik acuan yang stabil per fitur:
 *   - LineString / MultiLineString -> MIDPOINT sepanjang garis (arc-length)
 *   - Point                        -> titik itu sendiri
 */

import { jarak, bearing, selisihSudut } from './arProyeksi.js';

const R_BUMI = 6378137;

/** Jarak meter antara dua koordinat [lng,lat]. */
function jarakLL(a, b) {
    const lat0 = (a[1] + b[1]) / 2;
    const dx = ((b[0] - a[0]) * Math.PI / 180) * R_BUMI * Math.cos((lat0 * Math.PI) / 180);
    const dy = ((b[1] - a[1]) * Math.PI / 180) * R_BUMI;
    return Math.hypot(dx, dy);
}

/** Interpolasi linear dua koordinat. */
function interpolasi(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Titik tengah sebuah LINE (bukan rata-rata verteks).
 *
 * Penting: rata-rata verteks salah untuk garis dengan verteks tidak merata —
 * ruas 50 m dengan 20 verteks akan "menarik" midpoint ke sisi yang padat.
 * Yang benar adalah titik pada 50% PANJANG garis.
 *
 * @param {Array<[number,number]>} koordinat  [[lng,lat], ...]
 * @returns {{ titik:[number,number], panjang:number }|null}
 */
export function midpointLineString(koordinat) {
    if (!Array.isArray(koordinat) || koordinat.length === 0) return null;
    if (koordinat.length === 1) return { titik: koordinat[0], panjang: 0 };

    // panjang tiap ruas
    const ruas = [];
    let total = 0;
    for (let i = 0; i < koordinat.length - 1; i++) {
        const d = jarakLL(koordinat[i], koordinat[i + 1]);
        ruas.push(d);
        total += d;
    }

    if (total === 0) return { titik: koordinat[0], panjang: 0 };

    const target = total / 2;
    let jalan = 0;

    for (let i = 0; i < ruas.length; i++) {
        if (jalan + ruas[i] >= target) {
            const sisa = target - jalan;
            const t = ruas[i] === 0 ? 0 : sisa / ruas[i];
            return {
                titik: interpolasi(koordinat[i], koordinat[i + 1], t),
                panjang: total,
            };
        }
        jalan += ruas[i];
    }

    return { titik: koordinat[koordinat.length - 1], panjang: total };
}

/**
 * Titik acuan satu fitur — SELALU satu titik, apa pun tipe geometrinya.
 *
 * @param {Object} fitur GeoJSON Feature
 * @returns {{ titik:[number,number], panjang:number }|null}
 */
export function titikAcuanFitur(fitur) {
    const g = fitur?.geometry;
    if (!g || !Array.isArray(g.coordinates)) return null;

    if (g.type === 'LineString') {
        return midpointLineString(g.coordinates);
    }

    if (g.type === 'MultiLineString') {
        // Garis terpanjang mewakili fitur; kalau digabung, midpoint bisa
        // jatuh di antara dua garis yang berjauhan.
        let terpanjang = null;
        g.coordinates.forEach((garis) => {
            const m = midpointLineString(garis);
            if (m && (!terpanjang || m.panjang > terpanjang.panjang)) terpanjang = m;
        });
        return terpanjang;
    }

    if (g.type === 'Point') {
        return { titik: g.coordinates, panjang: 0 };
    }

    if (g.type === 'MultiPoint') {
        return g.coordinates.length ? { titik: g.coordinates[0], panjang: 0 } : null;
    }

    if (g.type === 'Polygon') {
        return midpointLineString(g.coordinates[0] || []);
    }

    if (g.type === 'MultiPolygon') {
        return midpointLineString(g.coordinates[0]?.[0] || []);
    }

    return null;
}

/**
 * Kunci unik fitur — dasar agregasi/de-duplikasi.
 *
 * Urutan prioritas: `id` GeoJSON, lalu kolom identitas milik tiap layer
 * (gid / id / nolang). Kalau semuanya kosong, dipakai koordinat acuan
 * sebagai kunci terakhir supaya fitur berbeda tidak saling menimpa.
 */
export function kunciFitur(fitur, titik) {
    const p = fitur?.properties || {};

    if (fitur?.id !== undefined && fitur?.id !== null && fitur?.id !== '') {
        return `id:${fitur.id}`;
    }

    const kandidat = [p.nolang, p.gid, p.id, p.nospk];
    for (const k of kandidat) {
        if (k !== undefined && k !== null && String(k).trim() !== '') {
            return `p:${k}`;
        }
    }

    if (titik) return `c:${titik[0].toFixed(6)},${titik[1].toFixed(6)}`;
    return null;
}

/**
 * Kelompokkan fitur per kunci unik, ambil wakil terdekat dari pengguna.
 *
 * Inilah fungsi AGRE GASI yang menjamin 1 ID = 1 objek label, walaupun data
 * dari server atau cache sampai dua kali.
 *
 * @param {Array} fiturList
 * @param {{lat:number,lng:number}} pos
 * @returns {Array<{ fitur, kunci, titik, jarak }>} satu entri per fitur unik
 */
export function agregasiPerFitur(fiturList, pos) {
    const peta = new Map();

    (fiturList || []).forEach((fitur) => {
        const acuan = titikAcuanFitur(fitur);
        if (!acuan) return;

        const kunci = kunciFitur(fitur, acuan.titik);
        if (!kunci) return;

        const [lng, lat] = acuan.titik;
        const j = jarak(pos.lat, pos.lng, lat, lng);

        const ada = peta.get(kunci);
        if (!ada || j < ada.jarak) {
            peta.set(kunci, { fitur, kunci, titik: acuan.titik, lat, lng, jarak: j, panjang: acuan.panjang });
        }
    });

    return [...peta.values()].sort((a, b) => a.jarak - b.jarak);
}

/** Bearing & selisih terhadap heading untuk satu titik acuan. */
export function arahTitik(pos, lat, lng, heading) {
    const b = bearing(pos.lat, pos.lng, lat, lng);
    return { bearing: b, rel: selisihSudut(b, heading) };
}
