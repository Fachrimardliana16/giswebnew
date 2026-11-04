/**
 * Camera AR — SATU SUMBER KEBENARAN untuk keadaan objek (Bug 2).
 *
 * Masalah yang diselesaikan:
 *   Header menampilkan "Tidak ada objek dalam 50 m" sementara panah arah
 *   justru menulis "Pipa 21 m, putar ke kanan".
 *
 * Penyebabnya: dua bagian kode menghitung sendiri-sendiri dari sumber berbeda.
 *   - header  : menghitung dari `segmen.length` (hasil render, sudah kena FOV)
 *   - penunjuk: menghitung dari `fiturPipa` mentah (belum difilter jarak/FOV)
 *
 * Modul ini menghapus kemungkinan itu. Semua bagian UI membaca SATU objek
 * `ringkasan` yang dihasilkan satu fungsi: hitungRingkasan().
 *
 * Alurnya:
 *   fitur mentah (per lapisan)
 *     -> saringJarak()      buang yang di luar jarak tampil
 *     -> saringTampil()     buang yang di luar FOV / di belakang kamera
 *     -> urutTerdekat()
 *     -> ringkasan          { ada, jumlah, terdekat, perLapisan }
 *
 * Header, panah arah, penghitung switch, dan badge semuanya memakai
 * `ringkasan` yang sama — tidak ada lagi perhitungan ganda.
 */

import { proyeksi, ambilGaris, jarak, bearing, selisihSudut } from './arProyeksi.js';

/**
 * Titik-titik sebuah fitur sebagai {lat,lng}.
 * Garis memakai SEMUA verteks; titik memakai satu.
 */
export function verteksFitur(fitur) {
    return ambilGaris(fitur)
        .filter((c) => Array.isArray(c) && c.length >= 2)
        .map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Saring fitur berdasarkan jarak saja (tanpa FOV).
 * Dipakai untuk menentukan "ada objek dalam N meter" — pertanyaan ini
 * TIDAK boleh bergantung pada arah kamera.
 *
 * @returns {Array<{fitur, jarak, lat, lng}>} terdekat lebih dulu
 */
export function saringJarak(features, pos, jarakMaks) {
    const hasil = [];

    (features || []).forEach((fitur) => {
        const verteks = verteksFitur(fitur);
        if (!verteks.length) return;

        // titik terdekat pada fitur ini
        let terdekat = null;
        verteks.forEach((v) => {
            const d = jarak(pos.lat, pos.lng, v.lat, v.lng);
            if (!terdekat || d < terdekat.jarak) terdekat = { ...v, jarak: d };
        });

        if (!terdekat || terdekat.jarak > jarakMaks) return;
        hasil.push({ fitur, jarak: terdekat.jarak, lat: terdekat.lat, lng: terdekat.lng });
    });

    return hasil.sort((a, b) => a.jarak - b.jarak);
}

/**
 * Saring hasil saringJarak() berdasarkan benar-benar terlihat di kamera.
 *
 * @returns {Array} entri + { x, y, relH, dalamFov }
 */
export function saringTampil(entri, kamera) {
    return entri
        .map((e) => {
            const pr = proyeksi({ ...kamera, lat: e.lat, lng: e.lng });
            return { ...e, x: pr.x, y: pr.y, relH: pr.relH, dalamFov: pr.dalamFov, tampil: pr.tampil };
        })
        .filter((e) => e.tampil);
}

/**
 * Susun ringkasan tunggal yang dipakai seluruh UI.
 *
 * @param {Object} p
 * @param {{lat:number,lng:number}|null} p.pos
 * @param {number} p.heading
 * @param {number} p.fovH
 * @param {number} p.jarakMaks
 * @param {Object} p.lapisan  { pipa: [...], pelanggan: [...], aksesoris: [...] }
 * @param {Object} p.tampilkan { pipa:bool, pelanggan:bool, aksesoris:bool }
 * @returns {Object} ringkasan
 */
export function hitungRingkasan(p) {
    const kosong = {
        ada: false,
        jumlahTotal: 0,
        terdekat: null,
        perLapisan: { pipa: [], pelanggan: [], aksesoris: [] },
        jumlahTampil: { pipa: 0, pelanggan: 0, aksesoris: 0 },
        siap: Boolean(p.pos),
        jarakMaks: p.jarakMaks,
    };

    if (!p.pos) return kosong;

    const kamera = {
        lat0: p.pos.lat,
        lng0: p.pos.lng,
        heading: p.heading,
        fovH: p.fovH,
        jarakMaks: p.jarakMaks,
    };

    const perLapisan = { pipa: [], pelanggan: [], aksesoris: [] };
    const jumlahTampil = { pipa: 0, pelanggan: 0, aksesoris: 0 };

    Object.keys(perLapisan).forEach((nama) => {
        if (!p.tampilkan?.[nama]) return;

        const dalamJarak = saringJarak(p.lapisan[nama], p.pos, p.jarakMaks);
        const dalamPandang = saringTampil(dalamJarak, kamera);

        perLapisan[nama] = dalamJarak;      // untuk "ada objek dalam N m"
        jumlahTampil[nama] = dalamPandang.length; // untuk penghitung switch
    });

    // Gabungan semua lapisan yang aktif — INI yang dipakai header & panah.
    const semua = [
        ...perLapisan.pipa.map((e) => ({ ...e, lapisan: 'pipa' })),
        ...perLapisan.pelanggan.map((e) => ({ ...e, lapisan: 'pelanggan' })),
        ...perLapisan.aksesoris.map((e) => ({ ...e, lapisan: 'aksesoris' })),
    ].sort((a, b) => a.jarak - b.jarak);

    const terdekat = semua.length ? semua[0] : null;

    // Arah terhadap heading — dipakai penunjuk arah. Null bila sudah di FOV.
    let arahTerdekat = null;
    if (terdekat) {
        const b = bearing(p.pos.lat, p.pos.lng, terdekat.lat, terdekat.lng);
        const rel = selisihSudut(b, p.heading);
        arahTerdekat = {
            bearing: b,
            rel,
            diLuarPandang: Math.abs(rel) >= p.fovH / 2,
            sisi: rel > 0 ? 'kanan' : 'kiri',
        };
    }

    return {
        ada: semua.length > 0,
        jumlahTotal: semua.length,
        terdekat,
        arahTerdekat,
        perLapisan,
        jumlahTampil,
        siap: true,
        jarakMaks: p.jarakMaks,
    };
}

/**
 * Teks status header — SATU tempat, diturunkan dari ringkasan.
 * Karena bersumber dari objek yang sama dengan panah arah, keduanya tidak
 * mungkin lagi bertentangan.
 */
export function teksStatus(ringkasan, sumberData) {
    if (!ringkasan.siap) return { teks: 'Mencari posisi…', jenis: 'info' };

    if (!ringkasan.ada) {
        return sumberData === '-'
            ? { teks: 'Mencari objek di sekitar…', jenis: 'info' }
            : { teks: `Tidak ada objek dalam ${ringkasan.jarakMaks} m`, jenis: 'ok' };
    }

    const bagian = [];
    const n = ringkasan.jumlahTampil;
    if (n.pipa) bagian.push(`${n.pipa} garis pipa`);
    if (n.pelanggan) bagian.push(`${n.pelanggan} pelanggan`);
    if (n.aksesoris) bagian.push(`${n.aksesoris} aksesoris`);

    if (bagian.length) {
        return { teks: `${bagian.join(' · ')} · ${ringkasan.jarakMaks} m`, jenis: 'ok' };
    }

    // Ada objek dalam jangkauan, tetapi tidak ada yang masuk pandangan kamera.
    const t = ringkasan.terdekat;
    return {
        teks: `Terdekat ${Math.round(t.jarak)} m, putar ke ${ringkasan.arahTerdekat?.sisi || 'arah objek'}`,
        jenis: 'info',
    };
}
