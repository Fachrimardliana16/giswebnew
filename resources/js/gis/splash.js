/**
 * Splash / layar tunggu aplikasi (PWA).
 *
 * Masalah yang diperbaiki: saat dibuka dari ikon PWA, browser menampilkan
 * halaman kosong (putih) sampai bundel JS dieksekusi dan Leaflet selesai
 * membuat peta. Di HP lambat ini terasa "blank lama" lalu tiba-tiba semua
 * muncul.
 *
 * Splash ini digambar oleh HTML/CSS murni (bukan JS), jadi langsung tampil
 * setelah cat pertama, dan ditutup dengan transisi halus begitu peta siap
 * (atau setelah batas waktu, supaya tidak pernah "nyangkut").
 *
 * Kontrak: dipanggil oleh app.js
 *   window.tutupSplashApp()  -> sembunyikan splash
 */

const ID = 'appSplash';
const KELAS_TUTUP = 'app-splash--tutup';
const BATAS_MS = 12000; // pengaman: splash tidak boleh menutupi aplikasi selamanya

let sudahTutup = false;

export function tutupSplashApp() {
    if (sudahTutup) return;
    sudahTutup = true;

    const el = document.getElementById(ID);
    if (!el) return;

    el.classList.add(KELAS_TUTUP);
    el.setAttribute('aria-hidden', 'true');

    // Lepas dari DOM setelah transisi selesai (jangan menahan klik/sentuh)
    const bersihkan = () => el.remove();
    el.addEventListener('transitionend', bersihkan, { once: true });
    setTimeout(bersihkan, 600);
}

export function initSplash() {
    const el = document.getElementById(ID);
    if (!el) return;

    // Kalau aplikasi tidak pernah siap (CDN mati, error fatal), tetap buka
    // splash supaya pesan error di dalam peta bisa dibaca pengguna.
    setTimeout(tutupSplashApp, BATAS_MS);

    // Abaikan klik pada splash (mencegah "klik tembus" ke peta)
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
}
