/**
 * Camera AR — sensor (GPS + kompas + giro).
 *
 * Heading diambil dari sensor perangkat, TANPA kalibrasi manual:
 *
 *  1. `deviceorientationabsolute` / `absolute === true`
 *       -> heading absolut (0 = utara), paling akurat.
 *  2. `webkitCompassHeading` (Safari iOS)
 *       -> sudah berupa arah hadap.
 *  3. Giroskop (`devicemotion.rotationRate.alpha`)
 *       -> dipakai sebagai sumber utama GERAKAN. Ini kunci stabilitas:
 *          kompas magnetik sering melompat (interferensi besi/beton), tetapi
 *          giro sangat halus dalam jangka pendek. Kita gabungkan:
 *            - setiap event kompas  -> koreksi absolut (drift giro dinolkan)
 *            - setiap event giro    -> integrasi kecepatan sudut (halus)
 *          Metode ini membuat garis tetap menempel saat HP diputar, lalu
 *          perlahan "ditarik" ke arah kompas yang benar. Tidak perlu slider.
 *  4. Kalau giro tidak ada, kompas saja + penghalusan (smoothing) biasa.
 *
 * Tidak ada lagi kalibrasi manual: pengguna tidak perlu menggeser apa pun.
 */

let izinDiminta = false;

/** Minta izin sensor gerak/kompas/giro. Harus dari handler klik. */
export async function mintaIzinOrientasi() {
    if (izinDiminta) return true;
    izinDiminta = true;

    const DOE = window.DeviceOrientationEvent;
    if (!DOE) return false;

    // iOS 13+: izin eksplisit. DeviceMotion punya izin terpisah.
    if (typeof DOE.requestPermission === 'function') {
        try {
            const hasil = await DOE.requestPermission();
            let gerak = true;
            const DME = window.DeviceMotionEvent;
            if (typeof DME?.requestPermission === 'function') {
                gerak = (await DME.requestPermission()) === 'granted';
            }
            return hasil === 'granted' && gerak;
        } catch (e) {
            return false;
        }
    }

    return true; // Android/desktop
}

/** Selisih sudut terpendek (-180..180). */
const selisih = (a, b) => ((a - b + 540) % 360) - 180;

/**
 * Pelacak heading gabungan kompas + giro.
 * @returns {{mulai, berhenti, heading, absolut, pakaiGiro, pitch}}
 */
export function buatKompas() {
    let heading = 0;        // hasil akhir, 0..360
    let adaAcuan = false;   // sudah pernah menerima nilai absolut
    let absolut = false;
    let acuanRelatif = null;

    let pakaiGiro = false;
    let tGiro = 0;          // timestamp integrasi terakhir (ms)
    let pitch = 90;         // kemiringan HP (beta+90), untuk geser horizon

    let terpasang = false;

    /* ---------- Kompas magnetik ---------- */

    const padaOrientasi = (e) => {
        let nilai = null;

        if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
            nilai = e.webkitCompassHeading;
            absolut = true;
        } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
            nilai = (360 - e.alpha) % 360;
            absolut = e.absolute === true;
        }

        // pitch: beta 0 = HP rebah menghadap atas, 90 = tegak
        if (typeof e.beta === 'number') {
            pitch = Math.max(0, Math.min(180, e.beta + 90));
        }

        if (nilai === null) return;

        if (!absolut) {
            if (acuanRelatif === null) acuanRelatif = nilai;
            nilai = (nilai - acuanRelatif + 360) % 360;
        }

        if (!adaAcuan) {
            heading = nilai;
            adaAcuan = true;
            return;
        }

        // Responsif: heading langsung mengikuti kompas (tidak lagi mengoreksi
        // 12-30% per event, yang membuat arah tertinggal dari gerakan HP).
        // Giro tetap dipakai untuk mengisi celah antar event kompas.
        heading = (heading + selisih(nilai, heading) * 0.85 + 360) % 360;
    };

    /* ---------- Giroskop ---------- */

    const padaGerak = (e) => {
        const rr = e.rotationRate;
        if (!rr || typeof rr.alpha !== 'number' || Number.isNaN(rr.alpha)) return;

        const kini = e.interval ? performance.now() : performance.now();
        if (!tGiro) { tGiro = kini; return; }

        const dt = Math.min(0.2, (kini - tGiro) / 1000); // detik, dibatasi 200 ms
        tGiro = kini;

        if (!adaAcuan) return;

        pakaiGiro = true;

        // rotationRate.alpha: derajat/detik, positif = berputar berlawanan
        // jarum jam (lihat spec). Heading bertambah searah jarum jam.
        const putar = -rr.alpha * dt;
        heading = (heading + putar + 360) % 360;
    };

    const mulai = () => {
        if (terpasang) return;
        window.addEventListener('deviceorientationabsolute', padaOrientasi, true);
        window.addEventListener('deviceorientation', padaOrientasi, true);
        window.addEventListener('devicemotion', padaGerak, true);
        terpasang = true;
    };

    const berhenti = () => {
        if (!terpasang) return;
        window.removeEventListener('deviceorientationabsolute', padaOrientasi, true);
        window.removeEventListener('deviceorientation', padaOrientasi, true);
        window.removeEventListener('devicemotion', padaGerak, true);
        terpasang = false;
    };

    return {
        mulai,
        berhenti,
        heading: () => (heading + 360) % 360,
        absolut: () => absolut,
        pakaiGiro: () => pakaiGiro,
        pitch: () => pitch,
    };
}

/**
 * Pelacak posisi GPS presisi tinggi (PRD FR-02).
 */
export function buatGps(saat, gagal) {
    let id = null;
    let terakhir = null;

    const mulai = () => {
        if (!('geolocation' in navigator)) {
            gagal(new Error('Perangkat tidak mendukung Geolocation.'));
            return;
        }

        id = navigator.geolocation.watchPosition(
            (pos) => {
                terakhir = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    akurasi: pos.coords.accuracy,
                    heading: typeof pos.coords.heading === 'number' ? pos.coords.heading : null,
                };
                saat(terakhir);
            },
            (e) => {
                const pesan = {
                    1: 'Izin lokasi ditolak. Aktifkan di pengaturan browser.',
                    2: 'Lokasi tidak tersedia. Cari area terbuka.',
                    3: 'Waktu habis mengambil lokasi.',
                }[e.code] || 'Gagal mengambil lokasi.';
                gagal(new Error(pesan));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
        );
    };

    const berhenti = () => {
        if (id !== null) {
            navigator.geolocation.clearWatch(id);
            id = null;
        }
    };

    return { mulai, berhenti, terakhir: () => terakhir };
}
