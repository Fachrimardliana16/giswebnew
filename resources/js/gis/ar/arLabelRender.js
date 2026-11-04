/**
 * Camera AR — penggambar label objek.
 *
 * Dipisah dari cameraAR.js supaya alur render tetap terbaca:
 *   susunLabel()  ->  gambarLabel()
 *
 * Semua label digambar SETELAH garis/pipa, dan hanya yang lolos uji
 * tabrakan di arLabel.js yang sampai ke sini.
 */

import { TEMA, tulis, kartu } from './arTema.js';
import { susunLabel, ukurLabel, anchorX } from './arLabel.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} p
 * @param {Array} p.kandidat  hasil render (segmen/titik) dengan { cx, cy, jarak, fitur, jenis }
 * @param {number} p.w,p.h
 * @param {number} p.jarakMaks
 * @returns {{tergambar: Array, ditolak: number}}
 */
export function gambarLabel(ctx, { kandidat, w, h, jarakMaks }) {
    const siap = (kandidat || []).map((k) => ({
        ...k,
        ukur: (c) => ukurLabel(c, k.judul, k.baris),
        anchorX: (kk, ukuran, lebarKanvas) => anchorX(kk, ukuran, lebarKanvas),
    }));

    const terpilih = susunLabel(ctx, { kandidat: siap, w, h, jarakMaks });

    let ditolak = 0;

    terpilih.forEach((item) => {
        const k = item.kandidat;
        const { kotak } = item;

        // konektor: dari titik objek ke tepi terdekat kartu
        ctx.save();
        ctx.strokeStyle = k.warnaKonektor || TEMA.pipa;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(k.cx, k.cy);
        ctx.lineTo(kotak.x < k.cx ? kotak.x + kotak.w : kotak.x, kotak.y + kotak.h / 2);
        ctx.stroke();
        ctx.restore();

        // kartu
        kartu(ctx, kotak.x, kotak.y, kotak.w, kotak.h, 10);

        // aksen kiri
        ctx.save();
        ctx.fillStyle = k.warna || TEMA.aksen;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(kotak.x + 1, kotak.y + 7, 2.5, kotak.h - 14, 3);
        else ctx.rect(kotak.x + 1, kotak.y + 7, 2.5, kotak.h - 14);
        ctx.fill();
        ctx.restore();

        const pad = 11;

        // Judul: bisa berubah jadi "3 Objek" saat cluster
        tulis(ctx, item.isCluster ? k.judulCluster : k.judul, kotak.x + pad, kotak.y + pad - 1, {
            ukuran: 11.5,
            warna: TEMA.teksUtama,
            bobot: 700,
        });

        // garis pemisah
        ctx.save();
        ctx.strokeStyle = TEMA.kartuGaris;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(kotak.x + pad, kotak.y + 17 + pad - 6);
        ctx.lineTo(kotak.x + kotak.w - pad, kotak.y + 17 + pad - 6);
        ctx.stroke();
        ctx.restore();

        // baris data — saat cluster, tampilkan ringkasan anggota
        const baris = item.isCluster
            ? [
                ['Jumlah', `${item.anggota.length + 1} objek`],
                ['Terdekat', `${Math.round(k.jarak)} m`],
                ['Terjauh', `${Math.round(Math.max(...item.anggota.map((a) => a.jarak)))} m`],
            ]
            : k.baris;

        baris.forEach(([kunci, nilai], bi) => {
            const by = kotak.y + 17 + pad + 2 + bi * 14.5;

            tulis(ctx, kunci, kotak.x + pad, by, {
                ukuran: 10,
                warna: TEMA.teksLembut,
                bobot: 600,
            });

            tulis(ctx, nilai, kotak.x + kotak.w - pad, by, {
                ukuran: 10,
                warna: TEMA.teksKedua,
                bobot: 700,
                rata: 'right',
            });
        });

        ditolak += item.anggota.length;
    });

    return { tergambar: terpilih, ditolak };
}
