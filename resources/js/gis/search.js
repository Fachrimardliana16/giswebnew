import { GEOSERVER_WFS_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';

export function initSearch(map) {
    const desktopInput = document.getElementById('customerSearchInput');
    const desktopButton = document.getElementById('searchButton');
    const mobileInput = document.getElementById('mobileCustomerSearchInput');
    const mobileButton = document.getElementById('mobileSearchButton');
    const clearButton = document.getElementById('clearSearch');
    let searchMarker = null;
    let isSearching = false;

    const setLoading = (loading) => {
        isSearching = loading;
        const buttons = [desktopButton, mobileButton];
        buttons.forEach(btn => {
            if (!btn) return;
            if (loading) {
                btn.disabled = true;
                btn.dataset.originalText = btn.textContent;
                btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
            } else {
                btn.disabled = false;
                btn.textContent = btn.dataset.originalText || (btn.id === 'searchButton' ? 'Cari' : 'Cari');
            }
        });
    };

    const performSearch = async (inputElement) => {
        const query = inputElement.value.trim();
        if (!query || isSearching) return;

        setLoading(true);
        console.log('Searching for:', query);
        
        try {
            // Build CQL Filter for Search (Supports Name and Account Number)
            const cqlFilter = `nama ILIKE '%${query}%' OR nolang LIKE '${query}%'`;
            
            const params = new URLSearchParams({
                service: 'WFS',
                version: '1.0.0',
                request: 'GetFeature',
                typeName: 'webgis:analisa_pelanggan',
                maxFeatures: 10,
                outputFormat: 'application/json',
                cql_filter: cqlFilter,
                // Optimization: specify properties to return if possible, but for popup we need many properties
                // propertyName: 'nama,nolang,status,cabang,tarif,drd_pemakaian,tungg_lembar,tungg_rp_tagihan,bacameter_tglbaca,bacameter_namacater,isvalid,debit,umurwm_tahun,wm_no_seri,wm_merek'
            });

            const response = await fetch(`${GEOSERVER_WFS_URL}?${params.toString()}`);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const coords = feature.geometry.coordinates;
                const latLng = [coords[1], coords[0]];

                if (searchMarker) map.removeLayer(searchMarker);

                map.setView(latLng, 18);

                searchMarker = L.circleMarker(latLng, {
                    radius: 12,
                    fillColor: "#3b82f6",
                    color: "#ffffff",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                const props = feature.properties;
                const popupContent = renderFeaturePopup(props.nama || 'Informasi Pelanggan', props, latLng[0], latLng[1]);
                
                searchMarker.bindPopup(popupContent, {
                    maxWidth: 320,
                    className: 'custom-gis-popup'
                }).openPopup();

                // If mobile, close the search container after finding
                const mobileContainer = document.getElementById('mobileSearchContainer');
                if (mobileContainer && mobileContainer.classList.contains('active')) {
                    mobileContainer.classList.remove('active');
                }

            } else {
                if (window.showToast) window.showToast('Data pelanggan tidak ditemukan', 'warning');
                else alert('Data tidak ditemukan');
            }
        } catch (error) {
            console.error('Search Error:', error);
            if (window.showToast) window.showToast('Gagal memuat data dari server', 'error');
            else alert('Terjadi kesalahan saat mencari data');
        } finally {
            setLoading(false);
        }
    };

    // Desktop Events
    if (desktopButton && desktopInput) {
        desktopButton.addEventListener('click', () => performSearch(desktopInput));
        desktopInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(desktopInput);
        });
    }

    // Mobile Events
    if (mobileButton && mobileInput) {
        mobileButton.addEventListener('click', () => performSearch(mobileInput));
        mobileInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(mobileInput);
        });
    }

    if (clearButton && desktopInput) {
        desktopInput.addEventListener('input', () => {
            if (desktopInput.value) {
                clearButton.classList.remove('hidden');
            } else {
                clearButton.classList.add('hidden');
            }
        });

        clearButton.addEventListener('click', () => {
            desktopInput.value = '';
            clearButton.classList.add('hidden');
            if (searchMarker) {
                map.removeLayer(searchMarker);
                searchMarker = null;
            }
            desktopInput.focus();
        });
    }
}

