import { createWMSLayer } from './config.js';

/**
 * Initialize and return all map layers
 * @returns {Object} Object containing all map layers
 */
export const initLayers = () => {
  // Get the layer IDs from the checkboxes to ensure they match
  const sumbermaCheckboxes = document.querySelectorAll('.pipa-sumberma-checkbox');
  const sumbermaIds = Array.from(sumbermaCheckboxes).map(checkbox => checkbox.id);

  const layers = {
    // Customer layer
    analisa_pelanggan: createWMSLayer('analisa_pelanggan', {
      format: 'image/png',
      transparent: true,
      tiled: true
    }),

    // Consolidated Pipe Layer (Handles Diameter and Source filters)
    web_pipa: createWMSLayer('web_pipa', { 
      cql_filter: "1=2", // Initially show nothing
      zIndex: 400,
      tiled: false, // Turn off tiling for dynamic filtering to ensure fresh data
      buffer: 0
    }),

    // Complaint monitoring layer
    monitoring_pengaduan: createWMSLayer('monitoring_pengaduan', {
      format: 'image/png',
      transparent: true,
      tiled: true
    }),

    all_airvalve: createWMSLayer('all_airvalve'),
    all_bend: createWMSLayer('all_bend'),
    all_checkvalve: createWMSLayer('all_checkvalve'),
    all_dop: createWMSLayer('all_dop'),
    all_firehydrant: createWMSLayer('all_firehydrant'),
    all_gatevalve: createWMSLayer('all_gatevalve'),
    all_meterinduk: createWMSLayer('all_meterinduk'),
    all_prv: createWMSLayer('all_prv'),
    all_reducer: createWMSLayer('all_reducer'),
    all_strainer: createWMSLayer('all_strainer'),
    all_tee: createWMSLayer('all_tee'),
    all_titik_tekanan: createWMSLayer('all_titik_tekanan'),
    all_washout1: createWMSLayer('all_washout1')
  };

  return layers;
};


