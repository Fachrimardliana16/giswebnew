import { GEOSERVER_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';

/**
 * Initialize GetFeatureInfo for map layers
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Map layers object
 */
export function initFeatureInfo(map, layers) {
    map.on('click', function (e) {
        const activeLayerIds = Object.keys(layers).filter(id => {
            const layer = layers[id];
            return map.hasLayer(layer);
        });

        if (activeLayerIds.length === 0) return;

        // Priotization Logic: Accessories > Pipes > Customers
        const priorityOrder = [
            'all_airvalve', 'all_bend', 'all_checkvalve', 'all_dop', 'all_firehydrant', 
            'all_gatevalve', 'all_meterinduk', 'all_prv', 'all_reducer', 'all_strainer', 
            'all_tee', 'all_titik_tekanan', 'all_washout',
            'pipa', // any ID containing 'pipa'
            'monitoring_pengaduan',
            'analisa_pelanggan'
        ];

        const sortedLayerIds = activeLayerIds.sort((a, b) => {
            let indexA = priorityOrder.findIndex(p => a.startsWith(p) || a.includes(p));
            let indexB = priorityOrder.findIndex(p => b.startsWith(p) || b.includes(p));
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;
            return indexA - indexB;
        });

        const point = map.latLngToContainerPoint(e.latlng, map.getZoom());
        const size = map.getSize();

        // Sequential Check function
        async function checkLayer(index) {
            if (index >= sortedLayerIds.length) return;

            const layerId = sortedLayerIds[index];
            const layer = layers[layerId];

            const params = {
                request: 'GetFeatureInfo',
                service: 'WMS',
                srs: 'EPSG:4326',
                styles: layer.wmsParams.styles,
                transparent: layer.wmsParams.transparent,
                version: layer.wmsParams.version,
                format: layer.wmsParams.format,
                bbox: map.getBounds().toBBoxString(),
                height: size.y,
                width: size.x,
                layers: layer.wmsParams.layers,
                query_layers: layer.wmsParams.layers,
                info_format: 'application/json',
                x: Math.round(point.x),
                y: Math.round(point.y)
            };

            if (layer.wmsParams.cql_filter) {
                params.cql_filter = layer.wmsParams.cql_filter;
            }

            const url = GEOSERVER_URL + L.Util.getParamString(params, GEOSERVER_URL, true);

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    const feature = data.features[0];
                    const props = feature.properties;
                    
                    // Fallback to layer name if 'nama' is missing
                    const title = props.nama || props.NAMA || layerId.replace(/_/g, ' ').toUpperCase();
                    const content = renderFeaturePopup(title, props, e.latlng.lat, e.latlng.lng);

                    L.popup({
                        maxWidth: 350,
                        className: 'custom-gis-popup'
                    })
                    .setLatLng(e.latlng)
                    .setContent(content)
                    .openOn(map);
                    
                    return true; // Found a feature, stop!
                } else {
                    // Try next layer
                    return await checkLayer(index + 1);
                }
            } catch (err) {
                console.error(`Error fetching info for ${layerId}:`, err);
                return await checkLayer(index + 1);
            }
        }

        checkLayer(0);
    });
}
