import { GEOSERVER_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';
import { ambilFiturSekitarWfs, tampilkanPemilih, LAYER_WFS } from './featurePicker.js';

/**
 * GetFeatureInfo untuk seluruh layer aktif.
 *
 * Optimasi: layer TITIK diambil lewat satu request WFS (BBOX kecil), bukan
 * 9x GetFeatureInfo per layer. Layer GARIS (pipa) memakai GetFeatureInfo
 * karena BBOX akan mengembalikan terlalu banyak fitur.
 *
 * Jika pada titik klik ada >1 fitur, tampilkan daftar pilihan.
 */
export function initFeatureInfo(map, layers) {
    const priorityOrder = [
        'all_airvalve', 'all_bend', 'all_checkvalve', 'all_dop', 'all_firehydrant',
        'all_gatevalve', 'all_meterinduk', 'all_prv', 'all_reducer', 'all_strainer',
        'all_tee', 'all_titik_tekanan', 'all_washout',
        'web_pipa',
        'monitoring_pengaduan',
        'analisa_pelanggan'
    ];

    let sedangMemproses = false;

    const tampilkanDetail = (k, latlng) => {
        const props = k.fitur.properties || {};
        const judul = props.nama || props.NAMA
            || String(k.namaLayer).replace(/_/g, ' ').toUpperCase();

        let flat = latlng.lat, flng = latlng.lng;
        const g = k.fitur.geometry;
        if (g && g.coordinates) {
            if (g.type === 'Point') {
                flng = g.coordinates[0];
                flat = g.coordinates[1];
            } else if (g.type === 'LineString') {
                const c = g.coordinates[Math.floor(g.coordinates.length / 2)];
                flng = c[0]; flat = c[1];
            }
        }

        L.popup({
            maxWidth: 340,
            minWidth: 300,
            className: 'custom-gis-popup',
            autoPanPadding: [16, 16],
        })
            .setLatLng(latlng)
            .setContent(renderFeaturePopup(judul, props, flat, flng))
            .openOn(map);
    };

    /** GetFeatureInfo untuk satu layer garis — satu titik saja. */
    const infoGaris = async (layer, layerId, latlng) => {
        const size = map.getSize();
        const point = map.latLngToContainerPoint(latlng);
        const p = {
            request: 'GetFeatureInfo', service: 'WMS', srs: 'EPSG:4326',
            styles: layer.wmsParams.styles || '',
            transparent: layer.wmsParams.transparent,
            version: layer.wmsParams.version,
            format: layer.wmsParams.format,
            bbox: map.getBounds().toBBoxString(),
            height: size.y, width: size.x,
            layers: layer.wmsParams.layers,
            query_layers: layer.wmsParams.layers,
            info_format: 'application/json',
            x: Math.round(point.x), y: Math.round(point.y),
        };
        if (layer.wmsParams.cql_filter) p.cql_filter = layer.wmsParams.cql_filter;

        const url = GEOSERVER_URL + L.Util.getParamString(p, GEOSERVER_URL, true);
        try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return (data.features || []).map(f => ({
                layerId,
                namaLayer: fiturTabel(f) || layerId,
                fitur: f,
                jarak: 0,
            }));
        } catch (e) {
            return [];
        }
    };

    const fiturTabel = (f) => String(f.id || '').split('.')[0];

    map.on('click', async function (e) {
        if (sedangMemproses) return;

        const aktif = (typeof layers.__daftar === 'function' ? layers.__daftar() : [])
            .filter(id => layers.__sudahDibuat(id) && map.hasLayer(layers[id]));
        if (!aktif.length) return;

        sedangMemproses = true;

        try {
            const titikAktif = aktif.filter(id => LAYER_WFS[id]);
            const garisAktif = aktif.filter(id => !LAYER_WFS[id]);

            // --- FITUR BARU: kumpulkan cql_filter tiap layer titik ---
            // Sumbernya layer WMS yang sedang tampil, jadi popup selalu
            // mengikuti filter yang sama dengan tile peta. Tanpa ini,
            // peta boleh kosong tapi klik tetap mengembalikan data.
            const cqlTitik = {};
            titikAktif.forEach((id) => {
                const cql = layers[id]?.wmsParams?.cql_filter;
                if (cql && String(cql).trim() !== '' && String(cql).trim() !== '1=1') {
                    cqlTitik[id] = String(cql);
                }
            });
            // --- AKHIR FITUR BARU ---

            // 1 request WFS untuk semua layer titik
            let kandidat = titikAktif.length
                ? await ambilFiturSekitarWfs(map, titikAktif, e.latlng, cqlTitik)
                : [];

            // GetFeatureInfo hanya untuk layer garis (pipa)
            for (const layerId of garisAktif) {
                const layer = layers[layerId];
                if (!layer) continue;
                const hasil = await infoGaris(layer, layerId, e.latlng);
                kandidat.push(...hasil);
                if (kandidat.length >= 8) break;
            }

            // buang duplikat (layer titik bisa muncul dari WFS & GetFeatureInfo)
            const kunci = new Set();
            kandidat = kandidat.filter(k => {
                const id = k.fitur.id || JSON.stringify(k.fitur.properties || {}).slice(0, 60);
                if (kunci.has(id)) return false;
                kunci.add(id);
                return true;
            });

            if (!kandidat.length) return;

            if (kandidat.length === 1) {
                tampilkanDetail(kandidat[0], e.latlng);
                return;
            }

            tampilkanPemilih(map, kandidat, e.latlng, (k) => tampilkanDetail(k, e.latlng));
        } catch (err) {
            console.error('FeatureInfo error:', err);
        } finally {
            sedangMemproses = false;
        }
    });
}
