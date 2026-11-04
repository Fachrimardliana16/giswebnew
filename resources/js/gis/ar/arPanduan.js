/**
 * Camera AR — garis bantu.
 *
 * Perubahan dari versi sebelumnya:
 *  - GARIS TANAH DIHAPUS. Utilitas sudah disepakati 1 m di bawah tanah,
 *    jadi tidak perlu lagi penanda permukaan.
 *  - Penanda arah diganti jadi SATU strip arah yang bergerak realtime
 *    (sebelumnya huruf U tetap diam, sehingga tidak terbaca).
 *  - Indikator sumbu ganda (X/Y) digabung jadi satu widget sudut, tidak lagi
 *    dua lingkaran yang saling menumpuk.
 */

import { TEMA, tulis } from './arTema.js';

/**
 * Posisi Y sebuah jarak — HARUS identik dengan pemetaan di arProyeksi.js.
 */
export function yUntukJarak(h, jarakM, jarakMaks = 10, elevasi = -1) {
    const atasPita = h * 0.55;
    const bawahPita = h * 0.97;
    // Identik dengan arProyeksi.proyeksi()
    const t = Math.min(1, Math.max(0, jarakM / Math.max(jarakMaks, 1)));
    const yPermukaan = bawahPita - Math.pow(1 - t, 0.6) * (bawahPita - atasPita);

    const sudutDepresi = (Math.atan2(Math.abs(elevasi), Math.max(jarakM, 0.9)) * 180) / Math.PI;
    const efek = Math.min(1, Math.tan((sudutDepresi * Math.PI) / 180) * 1.15);
    const geserMaks = (bawahPita - atasPita) * 0.32;

    return yPermukaan - Math.max(0, geserMaks * efek);
}

/**
 * Strip arah realtime.
 *
 * Menggambar skala arah yang ikut bergeser saat HP diputar: setiap 30°
 * ada tanda, angka derajat di tengah menunjukkan arah hadap saat ini, dan
 * penanda U/T/S/B muncul di posisinya masing-masing. Karena skalanya ikut
 * bergerak, pengguna bisa membaca arahnya kapan saja — bukan huruf diam.
 */
export function gambarArah(ctx, { w, heading }) {
    const y = 74;
    const lebar = w * 0.9;
    const x0 = (w - lebar) / 2;
    const tiap = 15;                       // derajat per tanda
    const pxPerDeg = lebar / 90;           // tampil 90° di kiri-kanan

    // latar strip
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0 - 6, y - 14, lebar + 12, 30, 8);
    else ctx.rect(x0 - 6, y - 14, lebar + 12, 30);
    ctx.fill();
    ctx.restore();

    // tanda tiap 15°
    const mulai = Math.ceil((heading - 45) / tiap) * tiap;
    for (let deg = mulai; deg <= heading + 45; deg += tiap) {
        const offset = (deg - heading) * pxPerDeg;
        const x = w / 2 + offset;
        if (x < x0 - 2 || x > x0 + lebar + 2) continue;

        const utama = ((deg % 90) + 360) % 360 === 0;
        const sedang = ((deg % 45) + 360) % 360 === 0;
        const tinggiGaris = utama ? 11 : sedang ? 8 : 5;

        ctx.save();
        ctx.strokeStyle = utama ? TEMA.aksen : TEMA.teksLembut;
        ctx.globalAlpha = Math.max(0.35, 1 - Math.abs(offset) / (lebar / 2));
        ctx.lineWidth = utama ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x, y + 4 + tinggiGaris);
        ctx.stroke();
        ctx.restore();

        if (utama) {
            tulis(ctx, namaArah(deg), x, y - 6, {
                ukuran: 11,
                warna: TEMA.aksen,
                bobot: 800,
                rata: 'center',
            });
        }
    }

    // penunjuk tengah (arah hadap sekarang)
    ctx.save();
    ctx.fillStyle = TEMA.aksen;
    ctx.beginPath();
    ctx.moveTo(w / 2, y - 12);
    ctx.lineTo(w / 2 - 5, y - 19);
    ctx.lineTo(w / 2 + 5, y - 19);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // angka derajat: selalu bergerak mengikuti kompas
    tulis(ctx, `${Math.round(heading)}°`, w / 2, y + 24, {
        ukuran: 11,
        warna: TEMA.teksUtama,
        bobot: 700,
        rata: 'center',
    });
}

function namaArah(deg) {
    const d = ((deg % 360) + 360) % 360;
    if (d === 0) return 'U';
    if (d === 90) return 'T';
    if (d === 180) return 'S';
    if (d === 270) return 'B';
    return '';
}

/**
 * Widget sudut X/Y — SATU kartu, bukan dua lingkaran terpisah.
 *
 * Menampilkan dua besaran sekaligus, bersebelahan:
 *   X = arah hadap kompas (0..360°, 0 = utara)
 *   Y = kemiringan HP (pitch; 0 = mendatar, 90 = tegak)
 */
export function gambarKompasXY(ctx, { x, y, heading, pitch, absolut }) {
    const wKartu = 132;
    const hKartu = 40;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = TEMA.kartuGaris;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - wKartu, y, wKartu, hKartu, 9);
    else ctx.rect(x - wKartu, y, wKartu, hKartu);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const kolom = wKartu / 2;

    // --- Kolom X (arah hadap) ---
    const cx1 = x - wKartu + kolom / 2;
    tulis(ctx, 'X', x - wKartu + 9, y + 12, { ukuran: 9, warna: TEMA.teksLembut, bobot: 800 });
    tulis(ctx, `${Math.round(heading)}°`, cx1 + 3, y + 13, {
        ukuran: 12,
        warna: TEMA.aksen,
        bobot: 800,
        rata: 'center',
    });
    tulis(ctx, absolut ? 'kompas' : 'relatif', cx1 + 3, y + 29, {
        ukuran: 8,
        warna: TEMA.teksLembut,
        bobot: 600,
        rata: 'center',
    });

    // pemisah vertikal
    ctx.save();
    ctx.strokeStyle = TEMA.kartuGaris;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - wKartu + kolom, y + 8);
    ctx.lineTo(x - wKartu + kolom, y + hKartu - 8);
    ctx.stroke();
    ctx.restore();

    // --- Kolom Y (kemiringan) ---
    const cx2 = x - kolom / 2;
    tulis(ctx, 'Y', x - kolom + 9, y + 12, { ukuran: 9, warna: TEMA.teksLembut, bobot: 800 });
    tulis(ctx, `${Math.round(pitch)}°`, cx2 + 3, y + 13, {
        ukuran: 12,
        warna: TEMA.teksUtama,
        bobot: 800,
        rata: 'center',
    });
    tulis(ctx, 'kemiringan', cx2 + 3, y + 29, {
        ukuran: 8,
        warna: TEMA.teksLembut,
        bobot: 600,
        rata: 'center',
    });
}

/** Kartu pesan di tengah layar. */
export function gambarPesan(ctx, { w, h, judul, isi }) {
    const cy = h * 0.38;
    const lebar = Math.min(w - 56, 290);
    const tinggi = isi ? 84 : 56;
    const x = (w - lebar) / 2;
    const y = cy - tinggi / 2;

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = TEMA.kartuBg;
    ctx.strokeStyle = TEMA.kartuGaris;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const r = 12;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + lebar, y, x + lebar, y + tinggi, r);
    ctx.arcTo(x + lebar, y + tinggi, x, y + tinggi, r);
    ctx.arcTo(x, y + tinggi, x, y, r);
    ctx.arcTo(x, y, x + lebar, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    tulis(ctx, judul, w / 2, y + (isi ? 29 : tinggi / 2), {
        ukuran: 12.5,
        warna: TEMA.teksUtama,
        bobot: 700,
        rata: 'center',
    });

    if (isi) {
        tulis(ctx, isi, w / 2, y + 54, {
            ukuran: 10,
            warna: TEMA.teksLembut,
            bobot: 500,
            rata: 'center',
            alfa: 0.95,
        });
    }
}

/** Label jarak melingkar mengikuti batas pandang yang sedang aktif. */
export function gambarJarak(ctx, { w, h, jarakMaks = 10, elevasi = -1 }) {
    const jarakLabel = [0.25, 0.5, 0.75, 1].map((f) => Math.max(1, Math.round(jarakMaks * f)));

    jarakLabel.forEach((m) => {
        const y = yUntukJarak(h, m, jarakMaks, elevasi);
        if (y > h - 12) return;

        ctx.save();
        ctx.strokeStyle = TEMA.garisJarak;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.05, y);
        ctx.lineTo(w * 0.72, y);
        ctx.stroke();
        ctx.restore();

        tulis(ctx, `${m} m`, w - 14, y, {
            ukuran: 9,
            warna: TEMA.teksLembut,
            bobot: 600,
            rata: 'right',
            alfa: 0.85,
        });
    });
}
