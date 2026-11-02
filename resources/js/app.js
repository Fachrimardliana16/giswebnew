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
