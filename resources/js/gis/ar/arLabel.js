/**
 * Camera AR — tata letak label di layar (Bug 1).
 *
 * Masalah yang diselesaikan:
 *   Label objek saling menumpuk horizontal sehingga tidak terbaca, dan
 *   jumlahnya bisa puluhan sekaligus.
 *
 * Pendekatan (tiga lapis):
 *
 *   1. CULLING   — hanya N label terdekat yang dipertimbangkan (N=6), dan
 *                  label untuk objek di luar jarak tampil dibuang lebih dulu.
 *   2. COLLISION — setiap label punya kotak (bounding box) di koordinat
 *                  layar. Kotak yang berpotongan dengan kotak yang SUDAH
 *                  DITERIMA tidak digambar, karena daftar sudah diurutkan
 *                  dari yang terdekat → label terjauh otomatis kalah.
 *   3. CLUSTER   — objek yang kotaknya bertabrakan dengan label yang sudah
 *                  ada digabung menjadi satu badge "3 Objek", bukan dibuang
 *                  diam-diam. Jadi pengguna tetap tahu ada lebih dari satu.
 *
 * Semua perhitungan memakai ukuran teks yang sudah diukur (measureText),
 * bukan perkiraan jumlah karakter, supaya kotaknya akurat.
 */

const MAKS_LABEL = 6;          // N label terdekat yang boleh tampil
const JARAK_LABEL_MIN = 0.4;   // jarak tampil minimum (meter)
const PADDING_KOTAK = 5;       // ruang antar label agar tidak menempel

/** Ukur kotak label untuk satu objek. */
export function ukurLabel(ctx, teksJudul, baris, pad = 11, barisTinggi = 14.5, judulTinggi = 17) {
    ctx.save();
    ctx.font = `600 10px "Plus Jakarta Sans", system-ui, sans-serif`;
    const lebarKunci = Math.max(...baris.map(([k]) => ctx.measureText(k).width));

    ctx.font = `700 10px "Plus Jakarta Sans", system-ui, sans-serif`;
    const lebarNilai = Math.max(...baris.map(([, v]) => ctx.measureText(v).width));

    ctx.font = `700 11.5px "Plus Jakarta Sans", system-ui, sans-serif`;
    const lebarJudul = ctx.measureText(teksJudul).width;
    ctx.restore();

    return {
        lebar: Math.max(lebarJudul, lebarKunci + 14 + lebarNilai) + pad * 2,
        tinggi: judulTinggi + baris.length * barisTinggi + pad + 4,
    };
}

/** Apakah dua kotak berpotongan (dengan margin)? */
export function berpotongan(a, b, margin = PADDING_KOTAK) {
    return !(
        a.x + a.w + margin <= b.x ||
        b.x + b.w + margin <= a.x ||
        a.y + a.h + margin <= b.y ||
        b.y + b.h + margin <= a.y
    );
}

/**
 * Susun daftar label yang akan digambar.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} p
 * @param {Array} p.kandidat  [{ jarak, cx, cy, fitur, jenis }] — belum disaring
 * @param {number} p.w,p.h    ukuran kanvas
 * @param {number} p.jarakMaks
 * @returns {Array} [{ kotak, kandidat, isCluster, anggota }]
 */
export function susunLabel(ctx, { kandidat, w, h, jarakMaks }) {
    // ---- 1. CULLING: buang yang terlalu jauh, urutkan terdekat ----
    const layak = (kandidat || [])
        .filter((k) => k.jarak >= JARAK_LABEL_MIN && k.jarak <= jarakMaks)
        .sort((a, b) => a.jarak - b.jarak)
        .slice(0, MAKS_LABEL * 3);   // ambil lebih dulu, sisanya jadi cluster

    const diterima = [];
    const tertolak = [];

    // ---- 2. COLLISION ----
    layak.forEach((k) => {
        const ukuran = k.ukur(ctx);
        const kotak = {
            x: k.anchorX(k, ukuran, w),
            y: Math.max(6, Math.min(h - ukuran.tinggi - 6, k.cy - ukuran.tinggi / 2)),
            w: ukuran.lebar,
            h: ukuran.tinggi,
        };

        const bentrok = diterima.find((item) => berpotongan(item.kotak, kotak));
        if (bentrok) {
            tertolak.push(k);
            bentrok.anggota.push(k);
            return;
        }

        if (diterima.length >= MAKS_LABEL) {
            tertolak.push(k);
            return;
        }

        diterima.push({ kotak, kandidat: k, isCluster: false, anggota: [] });
    });

    // ---- 3. CLUSTER: objek yang tertolak digabung ke label yang menabraknya ----
    diterima.forEach((item) => {
        if (item.anggota.length > 0) {
            const nama = item.kandidat.labelCluster || 'objek';
            item.kandidat = {
                ...item.kandidat,
                judulCluster: `${item.anggota.length + 1} ${nama}`,
            };
            item.isCluster = true;
        }
    });

    return diterima;
}

/** Hitung posisi X label: kanan objek bila muat, kalau tidak di kiri. */
export function anchorX(k, ukuran, w, offset = 18) {
    let x = k.cx + offset;
    if (x + ukuran.lebar > w - 10) x = k.cx - offset - ukuran.lebar;
    return Math.max(8, Math.min(x, w - ukuran.lebar - 8));
}

export const BATAS_LABEL = { MAKS_LABEL, JARAK_LABEL_MIN, PADDING_KOTAK };
