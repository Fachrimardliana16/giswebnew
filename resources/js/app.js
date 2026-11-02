import './bootstrap';
import { initMap, setupMapZoomHandler } from './gis/map.js';
import { initLayers } from './gis/layers.js';
import { initFilters } from './gis/filters.js';
import { initControls } from './gis/controls.js';
import { initMobileToggle, initProfileDropdown, initMobileSearch, initSidebarSections } from './gis/ui.js';
import { initSearch } from './gis/search.js';
import { initFeatureInfo } from './gis/featureInfo.js';
import { showToast } from './gis/toast.js';
import { initLoadingWatchdog } from './gis/loadingWatchdog.js';
import { initMobileApp } from './gis/mobileApp.js';
import { initSearchSuggest } from './gis/searchSuggest.js';
import { initPwa } from './gis/pwa.js';

/**
 * Tampilkan pesan gagal-muat di dalam area peta, bukan halaman blank.
 */
function tampilkanGagalPustaka(pesan) {
    const wadah = document.getElementById('map');
    if (!wadah) return;

    wadah.innerHTML = `
        <div class="grid-putus">
            <div class="grid-putus__kotak">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 9v4m0 4h.01"></path>
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                </svg>
                <h2 class="grid-putus__judul">Peta tidak dapat dimuat</h2>
                ${pesan.map(p => `<p class="grid-putus__teks">${String(p).replace(/[<>&]/g, '')}</p>`).join('')}
                <button type="button" class="grid-putus__tombol" id="gridPutusMuatUlang">Muat ulang</button>
            </div>
        </div>`;

    document.getElementById('gridPutusMuatUlang')?.addEventListener('click', async () => {
        // bersihkan cache service worker dulu: penyebab paling sering
        try {
            const reg = await navigator.serviceWorker?.getRegistration();
            reg?.active?.postMessage({ type: 'BERSIHKAN_CACHE' });
        } catch (e) { /* diabaikan */ }
        setTimeout(() => location.reload(), 400);
    });

    console.error('Peta gagal dimuat:', pesan.join(' '));
}

/**
 * Initialize the application when DOM is ready.
 *
 * Cek readyState dulu: skrip dimuat sebagai module (defer), jadi pada
 * kondisi tertentu DOMContentLoaded sudah lewat saat kode ini jalan.
 */
async function boot() {
    console.log('GIS App Initializing...');

    // PWA: daftarkan service worker & pantau status offline
    initPwa();

    // Initialize UI Toggles immediately for best responsiveness
    initMobileToggle();
    initProfileDropdown();
    initMobileSearch();
    initSidebarSections();
    initLoadingWatchdog();
    initMobileApp();

    /*
     * Leaflet & jQuery dimuat dari CDN (cdnjs). Kalau gagal — CDN lambat,
     * jaringan memblokir, atau cache rusak — initMap() akan melempar error
     * dan aplikasi berhenti tanpa peta. Dulu efeknya halaman tampak blank
     * dan error "window.map.on is not a function" membingungkan.
     *
     * Sekarang diperiksa lebih dulu dan diberi pesan yang bisa ditindak.
     */
    if (typeof window.L === 'undefined' || typeof window.L.map !== 'function') {
        tampilkanGagalPustaka([
            'Pustaka peta (Leaflet) gagal dimuat.',
            'Periksa koneksi internet, lalu muat ulang halaman.',
        ]);
        return;
    }

    try {
        // Initialize map
        const map = await initMap();
        window.map = map;

        // Initialize layers
        const layerGroups = initLayers(map);

        // Initialize controls
        initControls(map, layerGroups);

        // Initialize filters
        initFilters(map, layerGroups);

        // Aktifkan pengelola zoom-level layer (sebelumnya didefinisikan tapi
        // tidak pernah dipanggil, jadi layer di bawah minZoom tetap dirender)
        setupMapZoomHandler(map, layerGroups);

        // Initialize Search Feature
        initSearch(map);

        // Saran pencarian (autocomplete) di header desktop & mobile.
        // Memilih saran -> langsung jalankan pencarian titik itu.
        const jalankanCari = (input) => {
            const btn = input.id === 'mobileFloatSearch'
                ? document.getElementById('mobileFloatSearchBtn')
                : document.getElementById('searchButton');
            if (btn) btn.click();
        };

        initSearchSuggest(
            document.getElementById('customerSearchInput'),
            document.getElementById('desktopSuggest'),
            () => jalankanCari(document.getElementById('customerSearchInput')),
        );

        initSearchSuggest(
            document.getElementById('mobileFloatSearch'),
            document.getElementById('mobileSuggest'),
            () => jalankanCari(document.getElementById('mobileFloatSearch')),
        );

        // Initialize Feature Info (Click on Map)
        initFeatureInfo(map, layerGroups);

        console.log('GIS App Ready!');
    } catch (error) {
        console.error('GIS App Error:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
