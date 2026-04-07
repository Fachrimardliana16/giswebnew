import { GEOSERVER_WFS_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';

export function initSearch(map) {
    const searchInput = document.getElementById('customerSearchInput');
    const searchButton = document.getElementById('searchButton');
    const clearButton = document.getElementById('clearSearch');
    let searchMarker = null;

    if (!searchInput || !searchButton) return;

    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        console.log('Searching for:', query);
        
        try {
            // Build CQL Filter for Search (Supports Name and Account Number)
            const cqlFilter = `nama ILIKE '%${query}%' OR nolang LIKE '${query}%'`;
            console.log('WFS Search CQL:', cqlFilter);

            const params = new URLSearchParams({
                service: 'WFS',
                version: '1.0.0',
                request: 'GetFeature',
                typeName: 'webgis:analisa_pelanggan',
                maxFeatures: 50,
                outputFormat: 'application/json',
                cql_filter: cqlFilter
            });

            console.log('WFS URL:', `${GEOSERVER_WFS_URL}?${params.toString()}`);
            const response = await fetch(`${GEOSERVER_WFS_URL}?${params.toString()}`);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const coords = feature.geometry.coordinates;
                
                // GeoServer returns [lng, lat] for WFS 1.0.0 in some CRS, but usually [lng, lat]
                // We assume [lng, lat] and need [lat, lng] for Leaflet
                const latLng = [coords[1], coords[0]];

                // Clear previous search result
                if (searchMarker) map.removeLayer(searchMarker);

                // Zoom to first result
                map.setView(latLng, 18);

                // Add highlight marker
                searchMarker = L.circleMarker(latLng, {
                    radius: 12,
                    fillColor: "#3b82f6",
                    color: "#ffffff",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                // Add popup with info using centralized UI
                const props = feature.properties;
                const popupContent = renderFeaturePopup(props.nama || 'Informasi Pelanggan', props, latLng[0], latLng[1]);
                
                searchMarker.bindPopup(popupContent, {
                    maxWidth: 320,
                    className: 'custom-gis-popup'
                }).openPopup();

                console.log('Found:', props.nama);
            } else {
                alert('Data tidak ditemukan');
            }
        } catch (error) {
            console.error('Search Error:', error);
            alert('Terjadi kesalahan saat mencari data');
        }
    };

    // Events
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    if (clearButton) {
        searchInput.addEventListener('input', () => {
            if (searchInput.value) {
                clearButton.classList.remove('hidden');
            } else {
                clearButton.classList.add('hidden');
            }
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.classList.add('hidden');
            if (searchMarker) {
                map.removeLayer(searchMarker);
                searchMarker = null;
            }
            searchInput.focus();
        });
    }
}
