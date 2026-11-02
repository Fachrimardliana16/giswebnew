/**
 * Loading watchdog + indikator zoom untuk dashboard peta.
 *
 * Dulu inline di dashboard.blade.php. Dipindah ke modul karena CSP
 * (script-src tanpa 'unsafe-inline') memblokir <script> inline —
 * watchdog dan penanganan error tidak pernah aktif.
 */
import { showToast } from './toast.js';

let watchdog = null;
let zoomBound = false;
let ajaxBound = false;

const $sel = (sel) => document.querySelector(sel);
const tampil = (el, on, kelasTampil = 'flex') => {
    if (!el) return;
    el.classList.toggle('hidden', !on);
    el.classList.toggle(kelasTampil, on);
};

export function resetLoading() {
    window.loadingLayersCount = 0;
    tampil($sel('#loadingIndicator'), false);
    tampil($sel('#zoomHint'), false);
    if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
    }
}

export function startWatchdog() {
    if (watchdog) clearTimeout(watchdog);
    watchdog = setTimeout(() => {
        if (window.loadingLayersCount > 0) {
            console.warn('Loading terlalu lama, reset paksa');
            resetLoading();
            showToast('Beberapa data memerlukan zoom lebih dalam untuk tampil.', 'warning', 5000);
        }
    }, 8000);
}

export function stopWatchdog() {
    if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
    }
}

/**
 * Pasang hook global yang dipakai config.js (createWMSLayer)
 * dan pasang listener jQuery ajax bila jQuery tersedia.
 */
export function initLoadingWatchdog() {
    window.startLoadingWatchdog = startWatchdog;
    window.stopLoadingWatchdog = stopWatchdog;

    if (typeof window.$ !== 'undefined' && !ajaxBound) {
        ajaxBound = true;

        window.$(document).ajaxStart(() => {
            if (typeof window.loadingLayersCount === 'undefined') window.loadingLayersCount = 0;
            window.loadingLayersCount++;
            tampil($sel('#loadingIndicator'), true);

            if (window.map && window.map.getZoom() < 12) {
                tampil($sel('#zoomHint'), true);
            }

            startWatchdog();
        }).ajaxStop(() => {
            window.loadingLayersCount = Math.max(0, (window.loadingLayersCount || 0) - 1);
            if (window.loadingLayersCount <= 0) resetLoading();
        });
    }

    // Sembunyikan hint zoom begitu zoom cukup
    if (!zoomBound) {
        zoomBound = true;
        const interval = setInterval(() => {
            if (window.map) {
                clearInterval(interval);
                window.map.on('zoomend', () => {
                    const z = window.map.getZoom();
                    if (z >= 12) {
                        tampil($sel('#zoomHint'), false);
                    } else if (window.loadingLayersCount > 0) {
                        tampil($sel('#zoomHint'), true);
                    }
                });
            }
        }, 1000);
    }

    // Penanganan error tak terduga.
    //
    // Jangan hanya menampilkan "kendala teknis": itu menyembunyikan penyebab
    // dan membuat pengguna tidak tahu harus berbuat apa. Bedakan dua kasus:
    //  - aset gagal dimuat (biasanya cache service worker basi) -> tawarkan
    //    pemuatan ulang paksa
    //  - error lain -> beri tahu, sertakan ringkasan di konsol
    window.addEventListener('error', (e) => {
        const target = e.target || {};
        const url = target.src || target.href || '';

        // error memuat script/link (bukan error runtime)
        if (url && (url.includes('/build/') || url.endsWith('.js') || url.endsWith('.css'))) {
            console.error('Aset gagal dimuat:', url);
            showToast('Sebagian berkas aplikasi gagal dimuat. Ketuk untuk memuat ulang.', 'error', 0, {
                aksi: 'Muat ulang',
                onAksi: async () => {
                    // bersihkan cache service worker lalu muat ulang
                    try {
                        const reg = await navigator.serviceWorker?.getRegistration();
                        reg?.active?.postMessage({ type: 'BERSIHKAN_CACHE' });
                    } catch (err) { /* diabaikan */ }
                    setTimeout(() => location.reload(), 400);
                },
            });
            return;
        }

        // error runtime biasa
        console.error('Kesalahan aplikasi:', e.message || e.error);
    }, true);

}
