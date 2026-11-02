/**
 * Pemilih fitur bertumpuk.
 *
 * Masalah: saat beberapa titik berdekatan, klik hanya mengambil fitur
 * pertama dari layer pertama, sisanya tak bisa dipilih.
 *
 * Solusi dua lapis:
 *  1. Klik tunggal -> kumpulkan SEMUA fitur dalam radius piksel dari semua
 *     layer aktif. Jika >1, tampilkan daftar pilihan.
 *  2. Setelah daftar terbuka, klik salah satu item -> popup detail fitur itu.
 */

import { renderFeaturePopup } from './popupUI.js';

const RADIUS_PIKSEL = 14;   // toleransi klik (px)

/**
 * Ambil fitur di sekitar titik klik dari satu layer WMS.
 * Layer titik (analisa_pelanggan, asesoris) memakai GetFeatureInfo;
 * untuk layer garis (pipa) hanya titik yang benar-benar kena yang muncul.
 */
export async function ambilFiturSekitar(map, layer, layerId, latlng, radius = RADIUS_PIKSEL) {
    if (!layer || !layer.wmsParams) return [];

    const size = map.getSize();
    const point = map.latLngToContainerPoint(latlng);

    const params = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: layer.wmsParams.styles || '',
        transparent: layer.wmsParams.transparent,
        version: layer.wmsParams.version,
        format: layer.wmsParams.format,
        bbox: map.getBounds().toBBoxString(),
        height: size.y,
        width: size.x,
        layers: layer.wmsParams.layers,
        query_layers: layer.wmsParams.layers,
        info_format: 'application/json',
    };

    if (layer.wmsParams.cql_filter) {
        params.cql_filter = layer.wmsParams.cql_filter;
    }

    // Kumpulkan beberapa titik klik di sekitar jari/mouse
    const offsets = [[0, 0], [-radius, 0], [radius, 0], [0, -radius], [0, radius],
                     [-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]];

    const hasil = [];
    const terlihat = new Set();

    for (const [dx, dy] of offsets) {
        const x = Math.round(point.x + dx);
        const y = Math.round(point.y + dy);

        if (x < 0 || y < 0 || x > size.x || y > size.y) continue;

        const url = layer._url
            ? layer._url + L.Util.getParamString({ ...params, x, y }, layer._url, true)
            : null;
        if (!url) continue;

        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();

            (data.features || []).forEach(f => {
                const p = f.properties || {};
                // kunci unik: id fitur atau gabungan nolang/nama
                const kunci = f.id || p.nolang || p.nama || JSON.stringify(p).slice(0, 60);
                if (terlihat.has(kunci)) return;
                terlihat.add(kunci);

                hasil.push({
                    layerId,
                    namaLayer: (layer.wmsParams.layers || '').replace('webgis:', ''),
                    fitur: f,
                    jarak: Math.hypot(dx, dy),
                });
            });
        } catch (e) {
            // diamkan: layer ini saja yang gagal
        }

        // cukup 1 titik pusat bila sudah dapat banyak
        if (hasil.length > 12) break;
    }

    return hasil;
}

/**
 * Tampilkan daftar pilihan fitur yang bertumpuk.
 * @param {Object} map
 * @param {Array} kandidat hasil ambilFiturSekitar
 * @param {L.LatLng} latlng titik klik
 * @param {Function} onPilih callback(fitur, layerId)
 */
export function tampilkanPemilih(map, kandidat, latlng, onPilih) {
    if (!kandidat.length) return null;

    // urutkan: titik terdekat dulu
    kandidat.sort((a, b) => a.jarak - b.jarak);

    const ikonLayer = (id) => {
        if (id === 'analisa_pelanggan') return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
        if (id === 'monitoring_pengaduan') return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
        return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
    };

    const itemHTML = kandidat.slice(0, 20).map((k, i) => {
        const p = k.fitur.properties || {};
        const judul = p.nama || p.NAMA || p.nolang || k.namaLayer;
        const sub = p.nolang ? `No. Langganan ${p.nolang}` : (p.alamat || k.namaLayer);
        return `
        <button type="button" class="fpick__item" data-idx="${i}">
            <span class="fpick__ikon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${ikonLayer(k.layerId)}"/>
                </svg>
            </span>
            <span class="fpick__teks">
                <span class="fpick__judul">${String(judul).replace(/[<>&]/g, '')}</span>
                <span class="fpick__sub">${String(sub).replace(/[<>&]/g, '')}</span>
            </span>
            <span class="fpick__panah">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
            </span>
        </button>`;
    }).join('');

    const html = `
    <div class="fpick">
        <header class="fpick__head">
            <h3 class="fpick__title">${kandidat.length} data di titik ini</h3>
            <p class="fpick__hint">Pilih salah satu untuk melihat detail</p>
        </header>
        <div class="fpick__list">${itemHTML}</div>
    </div>`;

    const popup = L.popup({
        maxWidth: 300,
        minWidth: 260,
        className: 'custom-gis-popup',
        autoPanPadding: [16, 16],
    })
        .setLatLng(latlng)
        .setContent(html)
        .openOn(map);

    // pasang listener setelah popup masuk DOM
    setTimeout(() => {
        document.querySelectorAll('.fpick__item').forEach(btn => {
            btn.addEventListener('click', () => {
                const k = kandidat[parseInt(btn.dataset.idx, 10)];
                if (!k) return;
                map.closePopup();
                onPilih && onPilih(k);
            });
        });
    }, 30);

    return popup;
}
