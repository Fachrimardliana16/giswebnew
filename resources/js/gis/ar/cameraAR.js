/**
 * Camera AR — modul utama.
 *
 * Alur (sesuai PRD):
 *   klik tombol -> minta izin sensor -> buka kamera belakang -> mulai GPS ->
 *   loop render (rAF) -> tutup = matikan semua stream & sensor.
 *
 * Catatan penting keamanan: kamera hanya bisa dibuka di secure context
 * (https atau localhost). Bila tidak, kita tampilkan pesan yang jelas,
 * bukan layar hitam tanpa penjelasan.
 */

import {
    ambilPipaSekitar,
    ambilPelangganSekitar,
    ambilAksesorisSekitar,
    bacaAtribut,
    bacaAtributAksesoris,
    RADIUS_AR,
} from './arData.js';
import { buatKompas, buatGps, mintaIzinOrientasi } from './arSensor.js';
import { gambarGaris, gambarTitik, proyeksi, JARAK_MAKS, ELEVASI } from './arProyeksi.js';
import { TEMA } from './arTema.js';
import { hitungRingkasan, teksStatus } from './arState.js';
import { agregasiPerFitur, titikAcuanFitur } from './arGeometri.js';
import { gambarLabel } from './arLabelRender.js';
import {
    gambarArah,
    gambarJarak,
    gambarKompasXY,
    gambarPesan,
} from './arPanduan.js';

const WARNA = {
    garis: TEMA.pipa,
    garisTepi: TEMA.pipaTepi,
};

let status = 'mati'; // mati | membuka | aktif
let stream = null;
let gps = null;
let kompas = null;
let rafId = null;
let fetcher = null; // AbortController
let terakhirFetch = 0;
let posTerakhirQuery = null;

/** Nomor generasi permintaan data — mencegah respons lama menimpa data baru. */
let generasiData = 0;
let fiturPipa = [];
let fiturPelanggan = [];
let fiturAksesoris = [];

/** Status switch tampil/tidak per lapisan (Pipa / Pelanggan / Aksesoris). */
const tampilkan = { pipa: true, pelanggan: true, aksesoris: true };
let sumberData = '-';
let jarakTampil = 10;   // meter — diatur slider, menggantikan kalibrasi kompas
let fovH = 60;
let badgeTerakhir = [];

const $ = (sel) => document.querySelector(sel);

function pastikanSecure() {
    if (window.isSecureContext) return true;
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function setStatusTeks(teks, jenis = 'info') {
    const el = $('#arStatus');
    if (!el) return;
    el.textContent = teks;
    el.dataset.jenis = jenis;
}

function setAkurasi(akurasi) {
    const el = $('#arAkurasi');
    if (!el) return;
    if (typeof akurasi !== 'number') {
        el.textContent = 'GPS —';
        el.dataset.baik = '0';
        return;
    }
    el.textContent = `GPS ±${Math.round(akurasi)} m`;
    el.dataset.baik = akurasi <= 10 ? '1' : akurasi <= 25 ? '2' : '0';
}

function setSumber(sumber) {
    sumberData = sumber;
    const el = $('#arSumber');
    if (el) el.textContent = sumber === 'cache' ? 'Data tersimpan' : 'Data live';
}

/* ---------------- Kamera ---------------- */

async function bukaKamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera tidak didukung browser ini.');
    }

    const s = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
        },
        audio: false,
    });

    const video = $('#arVideo');
    video.srcObject = s;
    video.setAttribute('playsinline', '');
    video.muted = true;
    await video.play().catch(() => {});
    stream = s;
}

function tutupKamera() {
    if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
    }
    const video = $('#arVideo');
    if (video) video.srcObject = null;
}

/* ---------------- Loop render ---------------- */

function ukuranKanvas() {
    const c = $('#arCanvas');
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
    }
}

/**
 * Loop render.
 *
 * Kalkulasi berat (proyeksi verteks + uji tabrakan label) dijalankan maksimal
 * ~30x per detik. Pada perangkat kelas menengah, memproyeksikan belasan fitur
 * tiap frame bisa memakan lebih dari 16 ms sehingga frame drop.
 *
 * Indikator arah digambar di luar throttle supaya kompas tetap terasa
 * langsung saat HP diputar.
 */
const INTERVAL_HITUNG_MS = 33;
let terakhirHitung = 0;

function loop(waktu) {
    rafId = requestAnimationFrame(loop);

    const canvas = $('#arCanvas');
    if (!canvas) return;
    ukuranKanvas();

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Bersihkan tiap frame. Tanpa ini gambar lama tertinggal dan tampak
    // seperti garis "terseret" menumpuk.
    ctx.clearRect(0, 0, w, h);

    const pos = gps?.terakhir();
    if (!pos) {
        setStatusTeks('Mencari posisi…', 'info');
        return;
    }

    const heading = (kompas?.heading() || 0) % 360;
    const pitch = kompas?.pitch?.() ?? 90;

    // --- selalu tiap frame: indikator arah (murah, harus responsif) ---
    gambarArah(ctx, { w, heading });

    // --- throttled: proyeksi, label, dan seluruh UI turunan ---
    if (waktu - terakhirHitung < INTERVAL_HITUNG_MS) return;
    terakhirHitung = waktu;

    gambarFrame(ctx, { w, h, pos, heading, pitch });
}

/** Menggambar satu frame lengkap dan memperbarui seluruh UI turunan. */
function gambarFrame(ctx, { w, h, pos, heading, pitch }) {
    const kamera = {
        lat0: pos.lat,
        lng0: pos.lng,
        heading,
        fovH,
        fovV: 48,
        jarakMaks: jarakTampil,
        elevasi: ELEVASI,
        w,
        h,
    };

    gambarJarak(ctx, { w, h, jarakMaks: jarakTampil, elevasi: ELEVASI });
    gambarKompasXY(ctx, {
        x: w - 12,
        y: 104,
        heading,
        pitch,
        absolut: kompas?.absolut() ?? false,
    });

    // Urutan gambar: titik di bawah, garis pipa di atas, label paling atas.
    const titikPelanggan = tampilkan.pelanggan
        ? gambarTitik(ctx, { ...kamera, features: fiturPelanggan, warna: TEMA.pelanggan })
        : [];

    const titikAksesoris = tampilkan.aksesoris
        ? gambarTitik(ctx, { ...kamera, features: fiturAksesoris, warna: TEMA.aksesoris })
        : [];

    const segmen = tampilkan.pipa
        ? gambarGaris(ctx, {
            ...kamera,
            features: fiturPipa,
            warnaGaris: WARNA.garis,
            warnaGarisTepi: WARNA.garisTepi,
        })
        : [];

    // ---- SATU SUMBER KEBENARAN (Bug 2) ----
    // Ringkasan dihitung SEKALI, lalu dipakai header, panah arah, penghitung
    // switch, dan pesan layar. Tidak ada lagi perhitungan ganda yang bisa
    // menghasilkan "Tidak ada objek" padahal panah menunjuk objek.
    const ringkasan = hitungRingkasan({
        pos,
        heading,
        fovH,
        jarakMaks: jarakTampil,
        lapisan: {
            pipa: fiturPipa,
            pelanggan: fiturPelanggan,
            aksesoris: fiturAksesoris,
        },
        tampilkan,
    });

    // ---- Label dengan uji tabrakan (Bug 1) ----
    const kandidat = susunKandidatLabel(pos, heading, kamera);
    const hasilLabel = gambarLabel(ctx, {
        kandidat,
        w,
        h,
        jarakMaks: jarakTampil,
    });

    // diagnostik: pastikan tidak ada duplikat kunci yang lolos
    badgeTerakhir = hasilLabel.tergambar.map((i) => i.kandidat);
    badgeTerakhir = hasilLabel.tergambar.map((i) => i.kandidat);

    gambarPesanKondisi(ctx, { w, h, ringkasan, segmen });

    // ---- Semua UI dari ringkasan yang sama ----
    perbaruiPenunjuk(ringkasan);

    perbaruiJumlah('pipa', ringkasan.jumlahTampil.pipa);
    perbaruiJumlah('pelanggan', ringkasan.jumlahTampil.pelanggan);
    perbaruiJumlah('aksesoris', ringkasan.jumlahTampil.aksesoris);

    const { teks, jenis } = teksStatus(ringkasan, sumberData);
    setStatusTeks(teks, jenis);

    penunjukTerakhir = ringkasan;
}
/**
 * Susun kandidat label — SATU LABEL PER FITUR.
 *
 * Aturan yang ditegakkan di sini (perbaikan bug duplikasi label):
 *
 *   1. Sumber data adalah FITUR, bukan hasil render per-segmen. Sebelumnya
 *      label ditempatkan pada titik tengah segmen terdekat, sehingga satu
 *      LineString berverteks banyak menghasilkan banyak label berderet
 *      ("ERWAN…" berulang di sepanjang garis).
 *
 *   2. Posisi label = MIDPOINT fitur (titik pada 50% panjang garis), bukan
 *      verteks dan bukan centroid rata-rata verteks. Midpoint stabil: label
 *      tidak berpindah saat kamera diputar.
 *
 *   3. Agregasi per kunci unik (id/gid/nolang). Satu ID hanya boleh
 *      menghasilkan satu label, walau data datang ganda dari WFS + cache.
 */
function susunKandidatLabel(pos, heading, kamera) {
    const kandidat = [];

    const buat = (lapisan, daftarFitur, opsi) => {
        if (!tampilkan[lapisan]) return;

        // --- AGRE GASI: 1 kunci = 1 entri ---
        const unik = agregasiPerFitur(daftarFitur, pos);

        unik.forEach((u) => {
            // Proyeksikan MIDPOINT fitur, bukan verteks.
            const pr = proyeksi({
                ...kamera,
                lat: u.lat,
                lng: u.lng,
            });

            // Label hanya untuk objek yang benar-benar terlihat.
            if (!pr.tampil) return;
            if (u.jarak > jarakTampil) return;

            const { judul, baris } = opsi.isi(u.fitur, u.jarak);

            kandidat.push({
                cx: pr.x,
                cy: pr.y,
                jarak: u.jarak,
                fitur: u.fitur,
                kunci: u.kunci,
                warna: opsi.warna,
                warnaKonektor: opsi.warna,
                labelCluster: opsi.labelCluster,
                judul,
                baris,
            });
        });
    };

    // ---- Pipa: satu label di midpoint tiap LineString ----
    buat('pipa', fiturPipa, {
        warna: TEMA.pipa,
        labelCluster: 'pipa',
        isi: (fitur, j) => {
            const at = bacaAtribut(fitur);
            return {
                judul: at.jenis ? `Pipa ${at.jenis}` : 'Pipa',
                baris: [
                    ['Diameter', at.diameter ? `${at.diameter} mm` : '—'],
                    ['Kedalaman', at.kedalaman ? `${at.kedalaman} m` : '—'],
                    ['Jarak', `${Math.round(j)} m`],
                ],
            };
        },
    });

    // ---- Pelanggan: satu label per pelanggan ----
    buat('pelanggan', fiturPelanggan, {
        warna: TEMA.pelanggan,
        labelCluster: 'pelanggan',
        isi: (fitur, j) => {
            const p = fitur?.properties || {};
            return {
                judul: p.nama || p.nolang || 'Pelanggan',
                baris: [
                    ['Nomor', p.nolang || '—'],
                    ['Status', p.status || '—'],
                    ['Jarak', `${Math.round(j)} m`],
                ],
            };
        },
    });

    // ---- Aksesoris: satu label per objek ----
    buat('aksesoris', fiturAksesoris, {
        warna: TEMA.aksesoris,
        labelCluster: 'aksesoris',
        isi: (fitur, j) => {
            const at = bacaAtributAksesoris(fitur, fitur?.properties?.__jenis);
            return {
                judul: fitur?.properties?.__jenis || 'Aksesoris',
                baris: [
                    ['Diameter', at.diameter ? `${at.diameter} mm` : '—'],
                    ['Kondisi', at.kondisi || '—'],
                    ['Jarak', `${Math.round(j)} m`],
                ],
            };
        },
    });

    // Satu kunci hanya sekali, walau muncul dari dua lapisan.
    const terpakai = new Set();
    return kandidat
        .filter((k) => {
            if (!k.kunci) return true;
            if (terpakai.has(k.kunci)) return false;
            terpakai.add(k.kunci);
            return true;
        })
        .sort((a, b) => a.jarak - b.jarak);
}


function gambarPesanKondisi(ctx, { w, h, ringkasan, segmen }) {
    if (ringkasan.siap && !ringkasan.ada) {
        gambarPesan(ctx, {
            w,
            h,
            judul: sumberData === '-' ? 'Mencari objek di sekitar…' : `Tidak ada objek dalam ${ringkasan.jarakMaks} m`,
            isi: sumberData === '-' ? 'Arahkan kamera ke jalan' : 'Geser sedikit atau dekatkan ke jalur pipa',
        });
        return;
    }

    // Ada objek dalam jangkauan tetapi tidak satu pun masuk pandangan.
    if (ringkasan.ada && !segmen.length && !ringkasan.jumlahTampil.pelanggan && !ringkasan.jumlahTampil.aksesoris) {
        const sisi = ringkasan.arahTerdekat?.sisi || 'arah objek';
        gambarPesan(ctx, {
            w,
            h,
            judul: 'Objek di luar pandangan',
            isi: `Putar ke ${sisi} · terdekat ${Math.round(ringkasan.terdekat.jarak)} m`,
        });
    }
}

/**
 * Panah penunjuk arah — kini HANYA membaca ringkasan.
 *
 * Sebelumnya fungsi ini menghitung ulang titik terdekat dari fiturPipa mentah,
 * sehingga bisa menampilkan "Pipa 21 m" sementara header bilang "tidak ada
 * objek". Sekarang keduanya memakai `ringkasan.terdekat` yang sama.
 */
function perbaruiPenunjuk(ringkasan) {
    const el = $('#arPenunjuk');
    const teks = $('#arPenunjukTeks');
    if (!el || !teks) return;

    if (!ringkasan?.ada || !ringkasan.arahTerdekat?.diLuarPandang) {
        el.dataset.show = '0';
        el.setAttribute('aria-hidden', 'true');
        return;
    }

    el.dataset.show = '1';
    el.removeAttribute('aria-hidden');

    const { rel, sisi } = ringkasan.arahTerdekat;
    const panah = el.querySelector('.ar-penunjuk__panah');
    if (panah) panah.style.transform = `rotate(${rel}deg)`;

    const namaLapisan = {
        pipa: 'Pipa',
        pelanggan: 'Pelanggan',
        aksesoris: 'Aksesoris',
    }[ringkasan.terdekat.lapisan] || 'Objek';

    const besar = Math.abs(rel) > 135 ? ' (di belakang Anda)' : '';
    teks.textContent = `${namaLapisan} ${Math.round(ringkasan.terdekat.jarak)} m, putar ke ${sisi}${besar}`;
}

/** Perbarui indikator pada tombol switch. */
function perbaruiJumlah(nama, jumlah) {
    const el = document.querySelector(`[data-ar-jumlah="${nama}"]`);
    if (!el) return;
    el.textContent = String(jumlah);
    el.dataset.show = jumlah > 0 ? '1' : '0';
}


/* ---------------- Data ---------------- */

async function perbaruiData(pos, paksa = false) {
    if (!pos) return;
    const sekarang = Date.now();

    // Ambil ulang bila pengguna sudah bergerak cukup jauh (5 m), atau sudah
    // lewat 1 detik saat idle. Sebelumnya jeda tetap 4 detik, sehingga data
    // terasa tidak sinkron setelah berpindah tempat.
    const pindah = posTerakhirQuery
        ? jarakMeters(pos, posTerakhirQuery)
        : Infinity;

    // Lebih realtime: ambil ulang tiap 600 ms walau pengguna hanya bergeser
    // 2 m (sebelumnya 5 m / 1 detik).
    if (!paksa && pindah < 2 && sekarang - terakhirFetch < 600) return;
    terakhirFetch = sekarang;
    posTerakhirQuery = { lat: pos.lat, lng: pos.lng };

    // Batalkan permintaan sebelumnya, lalu tandai generasi baru.
    //
    // PENTING: setiap hasil hanya boleh menimpa state kalau ia berasal dari
    // generasi TERBARU. Tanpa penanda ini, respons lama yang datang terlambat
    // (abort tidak selalu membatalkan balasan yang sudah di jalan) akan
    // menimpa data baru -> garis menumpuk dan "terseret" seperti glitch.
    fetcher?.abort();
    fetcher = new AbortController();
    const generasi = ++generasiData;
    const sudahBasi = () => generasi !== generasiData;

    const radius = Math.max(RADIUS_AR, jarakTampil + 5);

    // Mulai ketiganya PARALEL sejak awal. Sebelumnya pipa ditunggu lebih dulu
    // (await), baru pelanggan & aksesoris dijalankan -> munculnya lambat.
    const janjiPipa = ambilPipaSekitar(pos.lat, pos.lng, { signal: fetcher.signal, radius });
    const janjiPelanggan = ambilPelangganSekitar(pos.lat, pos.lng, Math.max(60, jarakTampil * 2));
    const janjiAksesoris = ambilAksesorisSekitar(pos.lat, pos.lng, Math.max(40, jarakTampil * 2));

    // Pelanggan & aksesoris tidak menunggu pipa: begitu tiba, langsung dipakai.
    janjiPelanggan
        .then((f) => { if (!sudahBasi()) fiturPelanggan = f; })
        .catch(() => { if (!sudahBasi()) fiturPelanggan = []; });

    janjiAksesoris
        .then((f) => { if (!sudahBasi()) fiturAksesoris = f; })
        .catch(() => { if (!sudahBasi()) fiturAksesoris = []; });

    try {
        const hasil = await janjiPipa;
        if (sudahBasi()) return;

        // Ganti seluruh daftar, bukan menambah. Data lama tidak boleh tersisa:
        // itulah yang membuat garis "terseret" memanjang saat pandangan diubah.
        fiturPipa = hasil.features || [];
        setSumber(hasil.sumber);
        setStatusTeks(`${fiturPipa.length} segmen pipa di sekitar`, 'ok');
    } catch (e) {
        if (e.name === 'AbortError' || sudahBasi()) return;
        fiturPipa = [];
        setStatusTeks('Gagal memuat data pipa', 'error');
    }
}

/* ---------------- Buka / tutup ---------------- */

export async function bukaAR() {
    if (status !== 'mati') return;

    const panel = $('#arPanel');
    if (!panel) return;

    if (!pastikanSecure()) {
        panel.dataset.open = '1';
        setStatusTeks('AR butuh HTTPS. Buka aplikasi lewat https:// atau localhost.', 'error');
        return;
    }

    status = 'membuka';
    panel.dataset.open = '1';
    panel.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    setStatusTeks('Menyiapkan kamera…');

    // 1. izin kompas (harus dari gesture klik)
    const bolehKompas = await mintaIzinOrientasi();

    // 2. kamera
    try {
        await bukaKamera();
    } catch (e) {
        status = 'mati';
        setStatusTeks(
            e.name === 'NotAllowedError'
                ? 'Izin kamera ditolak. Aktifkan di pengaturan browser.'
                : 'Kamera tidak dapat dibuka.',
            'error'
        );
        return;
    }

    // 3. kompas + GPS
    kompas = buatKompas();
    if (bolehKompas) kompas.mulai();
    else setStatusTeks('Kompas tidak tersedia — arah garis memakai utara peta.', 'warning');

    gps = buatGps(
        (pos) => {
            setAkurasi(pos.akurasi);
            perbaruiData(pos);
        },
        (err) => {
            setAkurasi(null);
            setStatusTeks(err.message, 'error');
        }
    );
    gps.mulai();

    status = 'aktif';
    setStatusTeks('Mencari posisi…');
    loop();
}

export function tutupAR() {
    status = 'mati';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    fetcher?.abort();
    fetcher = null;
    terakhirFetch = 0;
    posTerakhirQuery = null;
    fiturPipa = [];
    fiturPelanggan = [];
    fiturAksesoris = [];

    gps?.berhenti();
    gps = null;

    kompas?.berhenti();
    kompas = null;

    tutupKamera();

    const panel = $('#arPanel');
    if (panel) {
        panel.dataset.open = '0';
        panel.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';

    const ctx = $('#arCanvas')?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, 9999, 9999);

    setStatusTeks('');
    setAkurasi(null);

    const pn = $('#arPenunjuk');
    if (pn) {
        pn.dataset.show = '0';
        pn.setAttribute('aria-hidden', 'true');
    }
    const bt = $('#arBantuan');
    if (bt) {
        bt.dataset.open = '0';
        bt.setAttribute('aria-hidden', 'true');
    }
    $('#arBantuanBtn')?.setAttribute('aria-expanded', 'false');
}

/* ---------------- Kontrol UI ---------------- */

export function initCameraAR() {
    const panel = $('#arPanel');
    if (!panel) return;

    document.querySelectorAll('[data-ar-buka]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            bukaAR();
        });
    });

    document.querySelectorAll('[data-ar-tutup]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tutupAR();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && status !== 'mati') tutupAR();
    });

    // Kartu bantuan: solusi untuk keluhan "AR membingungkan".
    const bantuan = $('#arBantuan');
    const bantuanBtn = $('#arBantuanBtn');
    const setBantuan = (buka) => {
        if (!bantuan || !bantuanBtn) return;
        bantuan.dataset.open = buka ? '1' : '0';
        bantuan.setAttribute('aria-hidden', buka ? 'false' : 'true');
        bantuanBtn.setAttribute('aria-expanded', buka ? 'true' : 'false');
    };
    bantuanBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        setBantuan(bantuan?.dataset.open !== '1');
    });
    document.querySelectorAll('[data-ar-bantuan-tutup]').forEach((b) => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            setBantuan(false);
        });
    });

    // SWITCH LAPISAN: pipa / pelanggan / aksesoris.
    // Tiga tombol bisa aktif bersamaan; mematikan salah satu hanya
    // menyembunyikan gambarnya, data tetap diambil (tidak perlu fetch ulang).
    document.querySelectorAll('[data-ar-layer]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const nama = btn.dataset.arLayer;
            if (!(nama in tampilkan)) return;

            tampilkan[nama] = !tampilkan[nama];
            btn.setAttribute('aria-checked', tampilkan[nama] ? 'true' : 'false');

            navigator.vibrate?.(8);
        });
    });

    // JARAK TAMPIL dinamis — menggantikan kalibrasi kompas manual.
    // Kompas kini otomatis (kompas + giroskop di arSensor.js), jadi tidak ada
    // lagi yang perlu digeser untuk arah. Yang disesuaikan adalah jarak.
    const slider = $('#arJarak');
    const nilai = $('#arJarakNilai');
    const chip = [...document.querySelectorAll('[data-jarak]')];

    const setJarak = (m) => {
        jarakTampil = Math.max(3, Math.min(120, Number(m) || 10));

        if (slider && Number(slider.value) !== jarakTampil) slider.value = String(jarakTampil);
        if (nilai) nilai.textContent = `${jarakTampil} m`;

        chip.forEach((c) => {
            c.setAttribute('aria-pressed', Number(c.dataset.jarak) === jarakTampil ? 'true' : 'false');
        });

        if (slider) slider.setAttribute('aria-valuetext', `${jarakTampil} meter`);

        // data diambil sedikit lebih luas dari jarak tampil, supaya saat slider
        // digeser ke atas datanya sudah tersedia (tanpa menunggu WFS)
        if (gps?.terakhir()) perbaruiData(gps.terakhir(), true);
    };

    slider?.addEventListener('input', () => setJarak(slider.value));
    chip.forEach((c) => {
        c.addEventListener('click', (e) => {
            e.preventDefault();
            setJarak(c.dataset.jarak);
        });
    });

    setJarak(Number(slider?.value) || 10);

    // Tab disembunyikan -> hentikan kamera (hemat baterai & privasi)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && status !== 'mati') tutupAR();
    });

    // Jangan biarkan tombol back browser meninggalkan kamera hidup
    window.addEventListener('pagehide', () => {
        if (status !== 'mati') tutupAR();
    });
}

/** Untuk diagnostik dari konsol: window.cameraAR.status() */
window.cameraAR = {
    buka: bukaAR,
    tutup: tutupAR,
    status: () => ({
        status,
        fitur: fiturPipa.length,
        pelanggan: fiturPelanggan.length,
        aksesoris: fiturAksesoris.length,
        tampilkan: { ...tampilkan },
        sumber: sumberData,
        jarakTampil,
        giro: kompas?.pakaiGiro?.() ?? false,
        absolut: kompas?.absolut?.() ?? false,
        pitch: kompas?.pitch?.() ?? null,
        badge: badgeTerakhir.length,
    }),
};
