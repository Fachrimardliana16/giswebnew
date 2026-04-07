import { GEOSERVER_WFS_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';

export function initSearch(map) {
    const desktopInput = document.getElementById('customerSearchInput');
    const desktopButton = document.getElementById('searchButton');
    const mobileInput = document.getElementById('mobileCustomerSearchInput');
    const mobileButton = document.getElementById('mobileSearchButton');
    const clearButton = document.getElementById('clearSearch');
    let searchMarker = null;

    const performSearch = async (inputElement) => {
        const query = inputElement.value.trim();
        if (!query) return;

        console.log('Searching for:', query);
        
        try {
            // Build CQL Filter for Search (Supports Name and Account Number)
            const cqlFilter = `nama ILIKE '%${query}%' OR nolang LIKE '${query}%'`;
            
            const params = new URLSearchParams({
                service: 'WFS',
                version: '1.0.0',
                request: 'GetFeature',
                typeName: 'webgis:analisa_pelanggan',
                maxFeatures: 50,
                outputFormat: 'application/json',
                cql_filter: cqlFilter
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
                if (mobileContainer) mobileContainer.classList.remove('active');

            } else {
                alert('Data tidak ditemukan');
            }
        } catch (error) {
            console.error('Search Error:', error);
            alert('Terjadi kesalahan saat mencari data');
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
