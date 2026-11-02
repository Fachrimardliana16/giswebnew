import { GEOSERVER_URL } from './config.js';
import { renderFeaturePopup } from './popupUI.js';
import { ambilFiturSekitar, tampilkanPemilih } from './featurePicker.js';

/**
 * GetFeatureInfo untuk seluruh layer aktif.
 *
 * Jika pada titik klik ada lebih dari satu fitur (titik bertumpuk),
 * tampilkan daftar pilihan sehingga user bisa memilih salah satunya.
 * Jika hanya satu, langsung tampilkan popup detail.
 */
export function initFeatureInfo(map, layers) {
    // Prioritas: asesoris > pipa > pengaduan > pelanggan
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
            || k.namaLayer.replace(/_/g, ' ').toUpperCase();

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

        const konten = renderFeaturePopup(judul, props, flat, flng);

        L.popup({
            maxWidth: 340,
            minWidth: 300,
            className: 'custom-gis-popup',
            autoPanPadding: [16, 16],
        })
            .setLatLng(latlng)
            .setContent(konten)
            .openOn(map);
    };

    map.on('click', async function (e) {
        if (sedangMemproses) return;

        const aktif = Object.keys(layers).filter(id => map.hasLayer(layers[id]));
        if (!aktif.length) return;

        const urut = aktif.sort((a, b) => {
            const ia = priorityOrder.indexOf(a);
            const ib = priorityOrder.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        sedangMemproses = true;

        try {
            // Kumpulkan kandidat dari semua layer aktif (dibatasi agar cepat)
            const kandidat = [];
            for (const layerId of urut) {
                const layer = layers[layerId];
                if (!layer) continue;

                const hasil = await ambilFiturSekitar(map, layer, layerId, e.latlng);
                kandidat.push(...hasil);

                // kalau sudah banyak, tidak perlu memeriksa layer prioritas rendah
                if (kandidat.length >= 8) break;
            }

            if (!kandidat.length) return;

            if (kandidat.length === 1) {
                tampilkanDetail(kandidat[0], e.latlng);
                return;
            }

            // Beberapa fitur bertumpuk -> beri user pilihan
            tampilkanPemilih(map, kandidat, e.latlng, (k) => {
                tampilkanDetail(k, e.latlng);
            });
        } catch (err) {
            console.error('FeatureInfo error:', err);
        } finally {
            sedangMemproses = false;
        }
    });
}
