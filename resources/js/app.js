import './bootstrap';
import { initMap } from './gis/map.js';
import { initLayers } from './gis/layers.js';
import { initFilters } from './gis/filters.js';
import { initControls } from './gis/controls.js';
import { initMobileToggle, initProfileDropdown, initMobileSearch } from './gis/ui.js';
import { initSearch } from './gis/search.js';
import { initFeatureInfo } from './gis/featureInfo.js';

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
        
        // Initialize layers
        const layerGroups = initLayers(map);
        
        // Initialize controls
        initControls(map, layerGroups);
        
        // Initialize filters
        initFilters(map, layerGroups);

        // Initialize Search Feature
        initSearch(map);

        // Initialize Feature Info (Click on Map)
        initFeatureInfo(map, layerGroups);
        
        console.log('GIS App Ready!');
    } catch (error) {
        console.error('GIS App Error:', error);
    }
});
