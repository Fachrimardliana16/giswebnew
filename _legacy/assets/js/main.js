// js/main.js
import { initializeMap, setupMapZoomHandler } from './modules/map.js';
import { initializeLayers, setupLayerControls } from './modules/layers.js';
import { setupStatusFilter, setupPipaSumbermaControls, setupComplaintFilter } from './modules/filter.js';
import { setupSectionCollapse, setupSidebarToggle, setupSearchToggle } from './modules/ui.js';
import { setupSearchFeatures } from './modules/search.js';
import { setupGetFeatureInfo } from './modules/featureInfo.js';

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize map
    const map = initializeMap();

    // Initialize layers
    const layers = initializeLayers();

    // Setup all controls and handlers
    setupLayerControls(map, layers);
    setupStatusFilter(map, layers);
    setupPipaSumbermaControls(map, layers);
    setupComplaintFilter(map, layers);
    setupSectionCollapse();
    setupSidebarToggle();
    setupSearchToggle();
    setupSearchFeatures(map, layers);
    setupMapZoomHandler(map, layers);

    // Setup click event for feature info
    map.on('click', (e) => setupGetFeatureInfo(map, layers, e));

  } catch (error) {
    console.error('Initialization error:', error);
    alert('Terjadi kesalahan saat menginisialisasi aplikasi. Silakan refresh halaman.');
  }
});
