import { sesuaikanZoomUntukLayer } from './map.js';

/**
 * Setup layer checkbox controls
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export const initControls = (map, layers) => {
  // 1. Handle individual layer checkboxes (Generic)
  document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const layerId = this.id;
      
      // Skip if this is a pipe-related checkbox (handled in filters.js)
      if (this.classList.contains('pipa-checkbox') || this.classList.contains('pipa-sumberma-checkbox')) {
        return;
      }

      const layer = layers[layerId];
      if (layer) {
        if (this.checked) {
          layer.addTo(map);
          // Add visual feedback
          const label = this.closest('.group')?.querySelector('label');
          if (label) label.classList.add('text-blue-600', 'font-black');

          // Kalau zoom sekarang terlalu jauh, sesuaikan otomatis
          // supaya tidak muncul peringatan kosong di awal.
          //
          // KECUALI analisa_pelanggan: zoom-nya ditangani filters/pelanggan.js
          // lewat zoomKeHasilFilter. Memanggil keduanya membuat dua
          // flyTo/fitBounds berjalan bersamaan dan saling menimpa —
          // peta zoom in lalu zoom out sendiri dan tile dimuat ulang.
          if (layerId !== 'analisa_pelanggan') {
            sesuaikanZoomUntukLayer(map, layerId);
          }
        } else {
          layer.remove();
          // Remove visual feedback
          const label = this.closest('.group')?.querySelector('label');
          if (label) label.classList.remove('text-blue-600', 'font-black');
        }
      }
    });
  });

  // 2. Setup Bulk Controls (Select All / Uncheck All)
  const bulkGroups = [
    { select: 'selectAllPipa', uncheck: 'uncheckAllPipa', class: 'pipa-checkbox' },
    { select: 'selectAllSumberma', uncheck: 'uncheckAllSumberma', class: 'pipa-sumberma-checkbox' },
    { select: 'selectAllAksesoris', uncheck: 'uncheckAllAksesoris', class: 'aksesoris-checkbox' }
  ];

  bulkGroups.forEach(group => {
    setupBulkGroup(group.select, group.uncheck, group.class, map, layers);
  });
};

/**
 * Setup bulk group controls
 */
const setupBulkGroup = (selectBtnId, uncheckBtnId, checkboxClass, map, layers) => {
  const selectBtn = document.getElementById(selectBtnId);
  const uncheckBtn = document.getElementById(uncheckBtnId);

  if (selectBtn) {
    selectBtn.addEventListener('click', () => {
      document.querySelectorAll(`.${checkboxClass}`).forEach(checkbox => {
        if (!checkbox.checked) {
          checkbox.checked = true;
          
          // Triggers the 'change' event so combined filters (Pipa / Sumber Air) update
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));

          // For accessories/other layers that are NOT consolidated
          if (!checkbox.classList.contains('pipa-checkbox') && !checkbox.classList.contains('pipa-sumberma-checkbox')) {
            const layer = layers[checkbox.id];
            if (layer) {
              layer.addTo(map);
              const label = checkbox.closest('.group')?.querySelector('label');
              if (label) label.classList.add('text-blue-600', 'font-black');
            }
          }
        }
      });
    });
  }

  if (uncheckBtn) {
    uncheckBtn.addEventListener('click', () => {
      document.querySelectorAll(`.${checkboxClass}`).forEach(checkbox => {
        if (checkbox.checked) {
          checkbox.checked = false;
          
          // Triggers the 'change' event so combined filters (Pipa / Sumber Air) update
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));

          // For accessories/other layers that are NOT consolidated
          if (!checkbox.classList.contains('pipa-checkbox') && !checkbox.classList.contains('pipa-sumberma-checkbox')) {
            const layer = layers[checkbox.id];
            if (layer) {
              layer.remove();
              const label = checkbox.closest('.group')?.querySelector('label');
              if (label) label.classList.remove('text-blue-600', 'font-black');
            }
          }
        }
      });
      map.closePopup();
    });
  }
};


