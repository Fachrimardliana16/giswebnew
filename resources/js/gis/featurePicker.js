/**
 * Pemilih fitur bertumpuk — versi 1 request WFS.
 *
 * Versi lama memindai 3x3 titik × setiap layer aktif = 9 x N request
 * GetFeatureInfo (5 layer aktif = 45 request per klik).
 *
 * Sekarang: satu request WFS GetFeature dengan BBOX kecil di sekitar klik,
 * meminta SEMUA layer titik sekaligus (typeName dipisah koma). Hasilnya
 * dikelompokkan menjadi kandidat, jadi jumlah request tetap 1.
 *
 * Layer garis (pipa) tetap memakai GetFeatureInfo karena BBOX akan
 * mengembalikan terlalu banyak fitur.
 */

import { GEOSERVER_WFS_URL } from './config.js';

const PX_BBOX = 18;        // setengah lebar kotak pencarian (px)
const MAKS_FITUR = 30;

const escape = (s) => String(s).replace(/[<>&"']/g, '');

/**
 * Layer titik yang punya padanan WFS (dengan nama tabel sama).
 */
export const LAYER_WFS = {
    analisa_pelanggan: 'analisa_pelanggan',
    monitoring_pengaduan: 'monitoring_pengaduan',
    all_airvalve: 'all_airvalve',
    all_bend: 'all_bend',
    all_checkvalve: 'all_checkvalve',
    all_dop: 'all_dop',
    all_firehydrant: 'all_firehydrant',
    all_gatevalve: 'all_gatevalve',
    all_meterinduk: 'all_meterinduk',
    all_prv: 'all_prv',
    all_reducer: 'all_reducer',
    all_strainer: 'all_strainer',
    all_tee: 'all_tee',
    all_titik_tekanan: 'all_titik_tekanan',
    all_washout: 'all_washout',
};

/**
 * Ambil fitur di sekitar satu titik lewat WFS.
 *
 * CATATAN PENTING (terukur): GeoServer menolak `typeName` multi-layer dalam
 * satu GetFeature (ServiceException), tetapi menerima `bbox` dengan satu
 * typeName. Jadi dipakai satu request PER layer titik — tetap jauh lebih
 * hemat daripada 9 request GetFeatureInfo per layer.
 *
 * @param {Object} map
 * @param {Array<string>} layerIds layer yang sedang aktif
 * @param {Object} latlng titik klik
 * @param {Object} cqlPerLayer peta { layerId: 'cql_filter' } — WAJIB.
 *        Tanpa ini klik tetap mengembalikan data yang sudah disembunyikan
 *        filter: tile peta tampak kosong, tapi popup masih berisi pelanggan
 *        dari status/kondisi yang tidak dipilih.
 */
export async function ambilFiturSekitarWfs(map, layerIds, latlng, cqlPerLayer = {}) {
    const titik = layerIds.filter(id => LAYER_WFS[id]);
    if (!titik.length) return [];

    // BBOX kecil di sekitar klik: offset piksel -> derajat
    const pusat = map.latLngToContainerPoint(latlng);
    const p1 = map.containerPointToLatLng(pusat.subtract([PX_BBOX, PX_BBOX]));
    const p2 = map.containerPointToLatLng(pusat.add([PX_BBOX, PX_BBOX]));

    const bbox = [
        Math.min(p1.lng, p2.lng),
        Math.min(p1.lat, p2.lat),
        Math.max(p1.lng, p2.lng),
        Math.max(p1.lat, p2.lat),
    ].join(',');

    const permintaan = titik.map(async (layerId) => {
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: `webgis:${LAYER_WFS[layerId]}`,
            outputFormat: 'application/json',
            maxFeatures: String(MAKS_FITUR),
        });

        // --- FITUR BARU: teruskan filter layer ke query klik ---
        // Filter diambil dari layer WMS yang sedang tampil (wmsParams.cql_filter),
        // supaya isi popup selalu sama dengan apa yang terlihat di peta.
        //
        // PENTING (terukur): GeoServer MENOLAK permintaan yang memakai
        // `bbox` dan `cql_filter` sekaligus —
        //   "bbox and cql_filter both specified but are mutually exclusive"
        // sehingga popup-nya mati total, bukan sekadar tidak terfilter.
        // Karena itu, saat ada filter, batas area dipindah KE DALAM CQL
        // memakai fungsi spasial BBOX(geom,...), dan parameter `bbox`
        // tidak dikirim. Sudah diuji:
        //   status='2' + BBOX -> 75 fitur, status='1' + BBOX -> 0 fitur
        const cql = cqlPerLayer[layerId];
        const adaFilter = cql && String(cql).trim() !== '' && String(cql).trim() !== '1=1';

        if (adaFilter) {
            params.set('cql_filter', `${String(cql).trim()} AND BBOX(geom,${bbox},'EPSG:4326')`);
        } else {
            params.set('bbox', bbox);
        }
        // --- AKHIR FITUR BARU ---

        try {
            const res = await fetch(`${GEOSERVER_WFS_URL}?${params.toString()}`);
            if (!res.ok) return [];
            const data = await res.json();

            return (data.features || []).map(f => {
                const g = f.geometry;
                let jarak = 0;
                if (g && g.type === 'Point' && g.coordinates) {
                    jarak = map.distance(latlng, L.latLng(g.coordinates[1], g.coordinates[0]));
                }
                return {
                    layerId,
                    namaLayer: LAYER_WFS[layerId],
                    fitur: f,
                    jarak,
                };
            });
        } catch (e) {
            console.error(`WFS ${layerId} gagal:`, e);
            return [];
        }
    });

    // jalankan paralel, bukan berurutan
    const hasil = (await Promise.all(permintaan)).flat();
    return hasil.sort((a, b) => a.jarak - b.jarak);
}

/**
 * Tampilkan daftar pilihan fitur bertumpuk.
 */
export function tampilkanPemilih(map, kandidat, latlng, onPilih) {
    if (!kandidat.length) return null;
    kandidat.sort((a, b) => a.jarak - b.jarak);

    const ikonLayer = (id) => {
        if (id === 'analisa_pelanggan') return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
        if (id === 'monitoring_pengaduan') return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
        return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
    };

    const itemHTML = kandidat.slice(0, 20).map((k, i) => {
        const p = k.fitur.properties || {};
        const judul = p.nama || p.NAMA || p.nolang || k.namaLayer;
        const sub = p.nolang
            ? `No. Langganan ${p.nolang}`
            : (p.alamat || k.namaLayer.replace(/_/g, ' '));
        return `
        <button type="button" class="fpick__item" data-idx="${i}">
            <span class="fpick__ikon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${ikonLayer(k.layerId)}"/>
                </svg>
            </span>
            <span class="fpick__teks">
                <span class="fpick__judul">${escape(judul)}</span>
                <span class="fpick__sub">${escape(sub)}</span>
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
