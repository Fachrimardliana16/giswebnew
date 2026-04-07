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

    // Pipe layers by diameter
    pipa400: createWMSLayer('web_pipa', { cql_filter: "diameter=400" }),
    pipa300: createWMSLayer('web_pipa', { cql_filter: "diameter=300" }),
    pipa250: createWMSLayer('web_pipa', { cql_filter: "diameter=250" }),
    pipa200: createWMSLayer('web_pipa', { cql_filter: "diameter=200" }),
    pipa150: createWMSLayer('web_pipa', { cql_filter: "diameter=150" }),
    pipa100: createWMSLayer('web_pipa', { cql_filter: "diameter=100" }),
    pipa75: createWMSLayer('web_pipa', { cql_filter: "diameter=75" }),
    pipa65: createWMSLayer('web_pipa', { cql_filter: "diameter=65" }),
    pipa50: createWMSLayer('web_pipa', { cql_filter: "diameter=50" }),
    pipa40: createWMSLayer('web_pipa', { cql_filter: "diameter=40" }),
    pipa25: createWMSLayer('web_pipa', { cql_filter: "diameter=25" }),
    pipa20: createWMSLayer('web_pipa', { cql_filter: "diameter=20" }),
    pipa15: createWMSLayer('web_pipa', { cql_filter: "diameter=15" }),

    // Water source pipe layers
    pipaReservoarKaranglewas: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='Reservoar Karanglewas'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaReservoarMeri: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='Reservoar Meri'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaReservoarKaranggambas: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='Reservoar Karanggambas'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaReservoarWalik: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='Reservoar Walik'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMALimbangan: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Limbangan'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMAKajongan: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Kajongan'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMAMulang2: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Mulang 2'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaCakotWalikKota1: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='CAKOT WALIK KOTA 1'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMAGombangan: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Gombangan'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaCakotWalikKota2: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='CAKOT WALIK KOTA   2'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMATukArus: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Tuk Arus'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMASikopyah: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Sikopyah'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMALimpakdau: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Limpakdau'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMAWadasKelir: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Wadas Kelir'",
      opacity: 1.0,
      zIndex: 999
    }),
    pipaMAPajerukan: createWMSLayer('web_pipa', { 
      cql_filter: "sumberma='MA Pajerukan'",
      opacity: 1.0,
      zIndex: 999
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


