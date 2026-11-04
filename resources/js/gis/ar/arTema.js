/**
 * Camera AR —token warna & tipografi.
 *
 * Satu sumber kebenaran untuk seluruh modul AR, supaya tampilan konsisten
 * dan formal: palet biru korporat Perumdam, bukan neon. Garis pipa tetap
 * berkontras tinggi (wajib terbaca di bawah matahari) tetapi memakai biru
 * muda tegas, bukan cyan menyala.
 */

export const TEMA = {
    // Garis pipa
    pipa: '#38bdf8',          // sky-400: kontras di aspal & rumput
    pipaTepi: '#0369a1',      // bayangan tipis, bukan halo neon
    pelanggan: '#fbbf24',     // amber-400: titik pelanggan
    aksesoris: '#a78bfa',     // violet-400: katup, hydrant, PRV, dll

    // Permukaan kartu
    kartuBg: 'rgba(15, 23, 42, 0.93)',   // slate-900
    kartuGaris: 'rgba(148, 163, 184, 0.38)',

    // Teks
    teksUtama: '#f1f5f9',
    teksKedua: '#cbd5e1',
    teksLembut: '#94a3b8',
    aksen: '#38bdf8',
    peringatan: '#fbbf24',

    // Bantu
    garisTanah: 'rgba(148, 163, 184, 0.55)',
    garisJarak: 'rgba(148, 163, 184, 0.22)',
};

export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';

/** Bingkai kartu bersudut halus — dipakai kartu badge, pesan, & bantuan. */
export function kartu(ctx, x, y, w, h, r = 12, { bg = TEMA.kartuBg, garis = TEMA.kartuGaris, tebal = 1 } = {}) {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    ctx.fillStyle = bg;
    ctx.fill();
    if (tebal > 0) {
        ctx.strokeStyle = garis;
        ctx.lineWidth = tebal;
        ctx.stroke();
    }
    ctx.restore();
}

/** Teks dengan gaya seragam (bukan huruf kapital semua — lebih formal). */
export function tulis(ctx, isi, x, y, {
    ukuran = 11,
    warna = TEMA.teksUtama,
    bobot = 600,
    rata = 'left',
    alfa = 1,
} = {}) {
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.font = `${bobot} ${ukuran}px ${FONT}`;
    ctx.textAlign = rata;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = warna;
    ctx.fillText(isi, x, y);
    ctx.restore();
}
