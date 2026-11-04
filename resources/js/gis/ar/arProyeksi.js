/**
 * Camera AR — proyeksi kamera.
 *
 * Prinsip yang dipakai (hasil penyederhanaan dari masukan lapangan):
 *
 *  1. ELEVASI. Semua utilitas dianggap tertanam rata-rata 1 meter di bawah
 *     permukaan tanah. Tidak ada kolom elevasi di PostGIS, jadi konstanta ini
 *     dipakai untuk menghitung seberapa jauh objek tampak "turun" dari garis
 *     pandang. Kabel/pipa 1 m di bawah tanah pada jarak 5 m terlihat jauh
 *     lebih rendah daripada objek di permukaan.
 *
 *  2. AREA BAWAH. Sumbu Y tidak pernah masuk separuh atas layar. Garis pandang
 *     kamera diarahkan ke permukaan jalan, sehingga seluruh utilitas berada
 *     di pita bawah — sesuai kenyataan saat petugas berdiri dan melihat jalan.
 *
 *  3. FOV KETAT. Objek hanya digambar bila benar-benar berada di dalam sudut
 *     pandang kamera. Tidak ada toleransi tambahan: begitu di luar bingkai,
 *     objek langsung hilang.
 */

import { TEMA, tulis, kartu } from './arTema.js';

const R_BUMI = 6378137;

/** Jarak pandang maksimum bawaan (meter). */
export const JARAK_MAKS = 10;

/** Kedalaman rata-rata utilitas dari permukaan tanah (meter). */
export const ELEVASI = -1.0;

/** Tinggi kamera di atas permukaan tanah (meter) — HP dipegang setinggi dada. */
export const TINGGI_KAMERA = 1.45;

/** Ubah selisih lat/lng menjadi meter relatif terhadap titik acuan. */
export function keMeter(lat0, lng0, lat, lng) {
    const x = ((lng - lng0) * Math.PI / 180) * R_BUMI * Math.cos((lat0 * Math.PI) / 180);
    const y = ((lat - lat0) * Math.PI / 180) * R_BUMI;
    return { x, y };
}

/** Bearing (azimuth) dari titik acuan ke target, 0..360. */
export function bearing(lat0, lng0, lat, lng) {
    const m = keMeter(lat0, lng0, lat, lng);
    return ((Math.atan2(m.x, m.y) * 180) / Math.PI + 360) % 360;
}

/** Jarak meter antara dua koordinat. */
export function jarak(lat0, lng0, lat, lng) {
    const m = keMeter(lat0, lng0, lat, lng);
    return Math.hypot(m.x, m.y);
}

/** Selisih sudut terpendek (-180..180). */
export function selisihSudut(a, b) {
    return ((a - b + 540) % 360) - 180;
}

/**
 * Proyeksikan satu titik dunia ke kanvas.
 *
 * @param {Object} p
 * @param {number} p.lat0,lng0   posisi pengguna
 * @param {number} p.lat,lng     objek
 * @param {number} p.heading     arah hadap (0..360)
 * @param {number} p.fovH        FOV horizontal kamera (derajat)
 * @param {number} p.w,p.h       ukuran kanvas (px)
 * @param {number} p.jarakMaks   batas jarak tampil (meter)
 * @param {number} p.elevasi     kedalaman objek (meter, negatif = di bawah tanah)
 * @returns {{x,y,jarak,relH,dalamFov,tampil,tinggi}}
 */
export function proyeksi(p) {
    const d = jarak(p.lat0, p.lng0, p.lat, p.lng);
    const b = bearing(p.lat0, p.lng0, p.lat, p.lng);

    const relH = selisihSudut(b, p.heading);
    const setengahFovH = (p.fovH || 60) / 2;
    const batas = p.jarakMaks || JARAK_MAKS;
    const elevasi = typeof p.elevasi === 'number' ? p.elevasi : ELEVASI;

    /* ---------- Sumbu X: perspektif horizontal ---------- */
    const fovV = 48;
    const fokus = (p.h / 2) / Math.tan((fovV / 2) * Math.PI / 180);
    const relHAman = Math.max(-89, Math.min(89, relH));
    const x = p.w / 2 + Math.tan((relHAman * Math.PI) / 180) * fokus;

    /* ---------- Sumbu Y: pita bawah, dipengaruhi elevasi ---------- */
    //
    // Dua komponen digabung:
    //   a. kedalaman  -> makin jauh makin naik ke atas (mendekati 55% layar)
    //   b. elevasi    -> objek 1 m di bawah tanah tampak lebih rendah,
    //                    dan efeknya makin kecil saat objek makin jauh
    //                    (sudut depresi ±1 m pada 30 m sudah hampir nol).
    const atasPita = p.h * 0.55;      // batas atas area utilitas
    const bawahPita = p.h * 0.97;     // dasar layar

    // Kurva jarak: objek dekat di dasar layar, objek jauh naik ke kaki-horizon.
    //
    // Kedalaman (elevasi) digabung sebagai PERGESERAN KE ATAS, bukan ke bawah.
    // Alasannya fisis: kamera 1,45 m di atas tanah diarahkan ke jalan. Objek
    // 1 m di bawah permukaan pada jarak 2 m terlihat DI ATAS dasar layar
    // (kita memandang menembus jalan di depan kaki), bukan di bawahnya.
    // Efeknya paling besar di jarak dekat dan habis di jarak jauh.
    const tJarak = Math.min(1, Math.max(0, d / Math.max(batas, 1)));
    const yPermukaan = bawahPita - Math.pow(1 - tJarak, 0.6) * (bawahPita - atasPita);

    const sudutDepresi = (Math.atan2(Math.abs(elevasi), Math.max(d, 0.9)) * 180) / Math.PI;
    const efekKedalaman = Math.min(1, Math.tan((sudutDepresi * Math.PI) / 180) * 1.15);

    // geseran dibatasi maksimum 32% tinggi pita, dan hanya ke ATAS
    const geserMaks = (bawahPita - atasPita) * 0.32;
    const y = yPermukaan - Math.max(0, geserMaks * efekKedalaman);

    /* ---------- Visibilitas: FOV KETAT ---------- */
    const diDepan = Math.abs(relH) < 90;
    const dalamFov = Math.abs(relH) < setengahFovH;   // < bukan <=, tanpa toleransi
    const dalamJarak = d <= batas;

    return {
        x,
        y,
        jarak: d,
        relH,
        tinggi: elevasi,
        diDepan,
        dalamFov,
        tampil: diDepan && dalamFov && dalamJarak,
    };
}

/* ---------------- Geometri fitur ---------------- */

/** Ambil daftar koordinat [lng,lat] dari geometry apa pun. */
export function ambilGaris(fitur) {
    const g = fitur?.geometry;
    if (!g || !Array.isArray(g.coordinates)) return [];
    if (g.type === 'LineString') return g.coordinates;
    if (g.type === 'MultiLineString') return g.coordinates.flat();
    if (g.type === 'Point') return [g.coordinates];
    if (g.type === 'MultiPoint') return g.coordinates;
    if (g.type === 'Polygon') return g.coordinates.flat(1);
    if (g.type === 'MultiPolygon') return g.coordinates.flat(2);
    return [];
}

/**
 * Potong segmen di garis tepi FOV (kiri/kanan) supaya bagian yang terlihat
 * tetap tergambar walau ujung lainnya di luar pandangan.
 *
 * @returns {{a:Object,b:Object}|null} null bila seluruh segmen di luar
 */
function potongDiFov(a, b, opsi) {
    const setengah = (opsi.fovH || 60) / 2;
    const aMasuk = Math.abs(a.relH) < setengah;
    const bMasuk = Math.abs(b.relH) < setengah;

    if (aMasuk === bMasuk) return null;

    // Ujung yang di dalam, dan ujung yang di luar
    const dalam = aMasuk ? a : b;
    const luar = aMasuk ? b : a;

    // Cari titik pada garis a-b yang relH-nya tepat di tepi FOV
    const tepi = Math.sign(luar.relH) * setengah;
    const rentang = luar.relH - dalam.relH;
    if (Math.abs(rentang) < 1e-6) return null;

    const t = (tepi - dalam.relH) / rentang;
    if (t <= 0.02 || t >= 0.98) return null;   // terlalu pendek, buang

    const titikPotong = {
        x: dalam.x + (luar.x - dalam.x) * t,
        y: dalam.y + (luar.y - dalam.y) * t,
        jarak: dalam.jarak + (luar.jarak - dalam.jarak) * t,
        relH: tepi,
        tampil: true,
    };

    return aMasuk
        ? { a: dalam, b: titikPotong }
        : { a: titikPotong, b: dalam };
}

/**
 * Gambar fitur garis (pipa) ke kanvas.
 * @returns {Array} segmen tergambar
 */
export function gambarGaris(ctx, opsi) {
    const { features, w, h, warnaGaris, warnaGarisTepi } = opsi;
    const tergambar = [];

    (features || []).forEach((fitur) => {
        const garis = ambilGaris(fitur);
        if (garis.length < 2) return;

        const titik = garis.map(([lng, lat]) => ({
            ...proyeksi({ ...opsi, lat, lng }),
            lat,
            lng,
        }));

        for (let i = 0; i < titik.length - 1; i++) {
            let a = titik[i];
            let b = titik[i + 1];

            // Segmen dipotong di tepi bingkai, BUKAN dibuang seluruhnya.
            //
            // Dulu syaratnya "kedua ujung harus di dalam FOV", sehingga pipa
            // panjang baru muncul ketika satu segmen penuh masuk pandangan —
            // itulah sebabnya data terasa lama keluar saat kamera diarahkan.
            // Sekarang bagian yang berada di luar dipotong di garis tepi FOV,
            // sehingga bagian yang terlihat langsung tergambar.
            if (!a.tampil && !b.tampil) continue;

            if (!a.tampil || !b.tampil) {
                const dipotong = potongDiFov(a, b, opsi);
                if (!dipotong) continue;
                a = dipotong.a;
                b = dipotong.b;
            }

            const dekat = Math.min(a.jarak, b.jarak);
            const batas = opsi.jarakMaks || JARAK_MAKS;
            const alfa = Math.max(0.4, Math.min(1, 1 - dekat / (batas * 1.3)));
            const tebal = Math.max(2, 5.5 - (dekat / batas) * 3);

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.strokeStyle = warnaGarisTepi;
            ctx.globalAlpha = alfa * 0.45;
            ctx.lineWidth = tebal + 2.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            ctx.strokeStyle = warnaGaris;
            ctx.globalAlpha = alfa;
            ctx.lineWidth = tebal;
            ctx.setLineDash([tebal * 3, tebal * 2]);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();

            tergambar.push({
                ax: a.x, ay: a.y, bx: b.x, by: b.y,
                jarak: dekat,
                cx: (a.x + b.x) / 2,
                cy: (a.y + b.y) / 2,
                fitur,
            });
        }
    });

    return tergambar;
}

/**
 * Gambar titik (pelanggan / aksesoris).
 * @returns {Array} titik tergambar (hanya yang di dalam FOV)
 */
export function gambarTitik(ctx, opsi) {
    const { features, w, h, warna = TEMA.pelanggan } = opsi;
    const hasil = [];

    (features || []).forEach((fitur) => {
        const pts = ambilGaris(fitur);
        if (!pts.length) return;

        const [lng, lat] = pts[0];
        const pr = proyeksi({ ...opsi, lat, lng });
        if (!pr.tampil) return;

        const batas = opsi.jarakMaks || JARAK_MAKS;
        const r = Math.max(4.5, Math.min(9, 9 - (pr.jarak / batas) * 5));
        const alfa = Math.max(0.55, Math.min(1, 1 - pr.jarak / (batas * 1.4)));

        ctx.save();
        ctx.globalAlpha = alfa;

        ctx.strokeStyle = warna;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r + 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = warna;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const nama = fitur?.properties?.nama
            || fitur?.properties?.nolang
            || fitur?.properties?.__jenis
            || 'Titik';
        const isi = `${nama} · ${Math.round(pr.jarak)} m`;

        ctx.font = `600 9.5px "Plus Jakarta Sans", system-ui, sans-serif`;
        const lebar = ctx.measureText(isi).width + 14;

        let bx = pr.x + r + 7;
        if (bx + lebar > w - 6) bx = pr.x - r - 7 - lebar;
        const by = Math.max(6, Math.min(h - 24, pr.y - 9));

        kartu(ctx, bx, by, lebar, 18, 6, {
            bg: 'rgba(15, 23, 42, 0.92)',
            garis: 'rgba(148, 163, 184, 0.35)',
        });

        tulis(ctx, isi, bx + 7, by + 9, {
            ukuran: 9.5,
            warna,
            bobot: 600,
            alfa,
        });

        hasil.push({ x: pr.x, y: pr.y, jarak: pr.jarak, fitur });
    });

    return hasil;
}

/** Alias lama. */
export const gambarPipa = gambarGaris;
