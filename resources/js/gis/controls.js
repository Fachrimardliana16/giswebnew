/**
 * Setup layer checkbox controls
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export const initControls = (map, layers) => {
  // 1. Handle individual layer checkboxes
  document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const layerId = this.id;
      const layer = layers[layerId];

      if (layer) {
        if (this.checked) {
          layer.addTo(map);
          console.log(`Layer activated: ${layerId}`);
          
          // Add visual feedback
          const label = this.parentElement.querySelector('label');
          if (label) {
            label.classList.add('text-blue-600', 'font-black');
          }
        } else {
          layer.remove();
          console.log(`Layer deactivated: ${layerId}`);
          
          // Remove visual feedback
          const label = this.parentElement.querySelector('label');
          if (label) {
            label.classList.remove('text-blue-600', 'font-black');
          }
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
          const layer = layers[checkbox.id];
          if (layer) {
            layer.addTo(map);
            const label = checkbox.parentElement.querySelector('label');
            if (label) label.classList.add('text-blue-600', 'font-black');
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
          const layer = layers[checkbox.id];
          if (layer) {
            layer.remove();
            const label = checkbox.parentElement.querySelector('label');
            if (label) label.classList.remove('text-blue-600', 'font-black');
          }
        }
      });
      map.closePopup();
    });
  }
};

