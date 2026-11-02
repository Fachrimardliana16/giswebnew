/**
 * Registrasi service worker untuk halaman LOGIN.
 *
 * Halaman login tidak memuat app.js (bundle peta), jadi SW didaftarkan
 * lewat file terpisah. HARUS file eksternal — CSP aplikasi ini melarang
 * <script> inline, dan inline yang diblokir gagal tanpa pesan terlihat.
 */
(function () {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
        navigator.serviceWorker
            .register('/sw.js?v=v1-2026-11-02', { scope: '/' })
            .catch(function (e) {
                console.warn('Service worker gagal didaftarkan:', e);
            });
    });
})();
