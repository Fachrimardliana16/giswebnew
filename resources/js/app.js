import './bootstrap';
import { initMap, setupMapZoomHandler } from './gis/map.js';
import { initLayers } from './gis/layers.js';
import { initFilters } from './gis/filters.js';
import { initControls } from './gis/controls.js';
import { initMobileToggle, initProfileDropdown, initMobileSearch } from './gis/ui.js';
import { initSearch } from './gis/search.js';
import { initFeatureInfo } from './gis/featureInfo.js';
import { showToast } from './gis/toast.js';

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('GIS App Initializing...');

    // Initialize UI Toggles immediately for best responsiveness
    initMobileToggle();
    initProfileDropdown();
    initMobileSearch();
    
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

        // Initialize Feature Info (Click on Map)
        initFeatureInfo(map, layerGroups);
        
        console.log('GIS App Ready!');
    } catch (error) {
        console.error('GIS App Error:', error);
    }
});
