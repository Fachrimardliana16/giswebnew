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

/**
 * Sembunyikan spinner TANPA membuang penghitung loading.
 *
 * resetLoading() mengosongkan loadingLayersCount. Kalau itu dipanggil saat
 * tile masih dimuat, tile yang selesai belakangan mengurangi penghitung
 * menjadi negatif dan status loading jadi kacau (spinner bisa nyangkut
 * atau hilang saat masih memuat).
 */
function sembunyikanSpinner() {
    tampil($sel('#loadingIndicator'), false);
    tampil($sel('#zoomHint'), false);
}

/**
 * Pengawas loading.
 *
 * BATAS_WAKTU dinaikkan dari 8 detik ke 40 detik.
 *
 * Alasannya terukur: filter `cabang` di GeoServer butuh 21-29 detik karena
 * kolomnya tidak terindeks. Dengan batas 8 detik, SETIAP pemilihan cabang
 * memicu "Loading terlalu lama, reset paksa" — padahal datanya memang sedang
 * datang, bukan gagal. Pesan "perlu zoom lebih dalam" juga menyesatkan:
 * masalahnya waktu tunggu server, bukan level zoom.
 *
 * Sekarang pengawas hanya bertindak sebagai jaring pengaman kalau server
 * benar-benar diam, dan pesannya menyebut penyebab yang benar.
 */
const BATAS_WAKTU = 40000;

export function startWatchdog() {
    if (watchdog) clearTimeout(watchdog);
    watchdog = setTimeout(() => {
        if (window.loadingLayersCount > 0) {
            console.warn('Data belum selesai dimuat setelah 40 detik; spinner disembunyikan.');
            sembunyikanSpinner();
            showToast('Data masih diproses server. Sebagian layer mungkin tampil lebih lambat.', 'warning', 6000);
        }
    }, BATAS_WAKTU);
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
    //
    // URL gambar yang sudah dilaporkan, supaya satu tile yang gagal tidak
    // dicatat berulang kali setiap kali peta digeser.
    const gagalMuatGambar = new Set();

    window.addEventListener('error', (e) => {
        // Kegagalan memuat <img>/<script>/<link> juga memicu event 'error',
        // tetapi TIDAK punya .message (nilainya null) dan target-nya elemen,
        // bukan window. Tanpa cabang di bawah, tiap tile WMS yang gagal
        // mencetak "Kesalahan aplikasi: undefined" — satu baris per tile,
        // sehingga konsol dibanjiri pesan tanpa informasi apa pun.
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

        // error memuat gambar/tile peta: laporkan sekali saja per URL,
        // jangan ditebalkan ke konsol dan jangan diteruskan ke toast —
        // satu kali pan sudah bisa memicu puluhan tile gagal.
        if (target.tagName === 'IMG' || /\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(url)) {
            const sudah = gagalMuatGambar.has(url);
            gagalMuatGambar.add(url);
            if (!sudah) {
                console.error('Aset gambar gagal dimuat:', url);
            }
            return;
        }

        // error runtime biasa (target === window, punya .message)
        const pesan = e.message || (e.error && e.error.message) || '(tanpa pesan)';
        console.error('Kesalahan aplikasi:', pesan, e.error || '');
    }, true);

}
