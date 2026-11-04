/**
 * Service worker WebGIS Tirta Perwira.
 *
 * Strategi per jenis permintaan:
 *  - Aset build (JS/CSS berhash)  -> cache-first, permanen (nama file berubah
 *                                    tiap build, jadi aman)
 *  - Tile WMS (GetMap)            -> cache-first dengan batas jumlah, plus
 *                                    jaringan sebagai cadangan. Tile peta
 *                                    statis per (layer, bbox, zoom, filter),
 *                                    jadi aman di-cache.
 *  - Tile basemap (OSM/Google)    -> cache-first, dibatasi
 *  - Halaman HTML                 -> network-first, fallback ke cache
 *  - /geo-proxy selain GetMap     -> network-only (data harus segar)
 *  - POST/PUT/DELETE              -> tidak disentuh
 *
 * PENTING: naikkan VERSI setiap kali mengubah logika cache. Tanpa itu,
 * browser memakai SW lama dan perubahan tidak pernah sampai ke pengguna.
 */

const VERSI = 'v7-2026-11-04b';
const CACHE_ASET = `webgis-aset-${VERSI}`;
const CACHE_TILE = `webgis-tile-${VERSI}`;
const CACHE_HALAMAN = `webgis-halaman-${VERSI}`;
const CACHE_LAIN = `webgis-lain-${VERSI}`;

// Batas tile dinaikkan dari 400 -> 1500.
//
// Satu layar zoom 18 pada peta ini butuh ~12-24 tile per layer, dan
// keepBuffer:6 menahan ~2 layar tambahan di sekitarnya untuk tiap layer
// yang aktif. Dengan 400 entri, cache penuh setelah beberapa langkah zoom
// sehingga pan balik ke area yang baru dilihat tetap memuat ulang tile.
// 1500 tile (256px, ~10 KB masing-masing) kira-kira 15-30 MB — masih wajar.
const BATAS_TILE = 1500;
const BATAS_LAIN = 60;

/** Aset inti yang diambil saat install (app shell). */
const ASET_INTI = [
    '/login',
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_ASET);
        // jangan gagal total kalau satu aset tidak tersedia
        await Promise.allSettled(ASET_INTI.map(u => cache.add(u)));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // hapus cache versi lama
        const nama = await caches.keys();
        await Promise.all(
            nama
                // Buang SEMUA cache versi lama, termasuk cache aset.
                // Cache aset lama berisi CSS/JS berhash yang tidak akan pernah
                // dipakai lagi setelah build baru — menyimpannya hanya membuat
                // kebingungan saat diagnosa.
                .filter(n => n.startsWith('webgis-') && !n.endsWith(VERSI))
                .map(n => caches.delete(n))
        );
        await self.clients.claim();
    })());
});

/** Batasi jumlah entri cache (LRU sederhana berbasis waktu masuk). */
async function batasiCache(namaCache, batas) {
    const cache = await caches.open(namaCache);
    const kunci = await cache.keys();
    if (kunci.length <= batas) return;

    // buang yang paling lama
    const lebih = kunci.length - batas;
    for (let i = 0; i < lebih; i++) {
        await cache.delete(kunci[i]);
    }
}

/** Cache-first + simpan ke cache. */
async function cacheDulu(request, namaCache, batas) {
    const cache = await caches.open(namaCache);
    const tersimpan = await cache.match(request);
    if (tersimpan) return tersimpan;

    try {
        const res = await fetch(request);
        // hanya simpan respons sah (hindari menyimpan error GeoServer)
        if (res && res.ok && res.status === 200) {
            const tipe = res.headers.get('content-type') || '';
            const bolehSimpan = /image\//.test(tipe) || /javascript|css|font|json/.test(tipe);
            if (bolehSimpan) {
                await cache.put(request, res.clone());
                if (batas) batasiCache(namaCache, batas);
            }
        }
        return res;
    } catch (e) {
        // offline: coba apa pun yang ada
        const cadangan = await cache.match(request);
        if (cadangan) return cadangan;
        throw e;
    }
}

/** Network-first dengan fallback cache (untuk HTML). */
async function jaringanDulu(request) {
    const cache = await caches.open(CACHE_HALAMAN);
    try {
        const res = await fetch(request);
        if (res && res.ok) {
            await cache.put(request, res.clone());
        }
        return res;
    } catch (e) {
        const tersimpan = await cache.match(request);
        if (tersimpan) return tersimpan;

        // fallback terakhir: halaman login (shell)
        const shell = await caches.match('/login');
        if (shell) return shell;
        throw e;
    }
}

/**
 * Stale-while-revalidate untuk ASET BUILD.
 *
 * Cache-first permanen berbahaya di sini: Vite memberi nama berhash, tetapi
 * nama bisa TIDAK berubah walau isinya berubah. Kalau aset disajikan dari
 * cache selamanya, pengguna bisa mendapat CSS/JS lama sementara manifest
 * menunjuk file baru -> aplikasi gagal boot dan muncul
 * "sistem mengalami kendala teknis".
 *
 * SWR: sajikan cache segera (cepat), lalu perbarui di latar belakang.
 */
async function asetBuild(request, event) {
    const cache = await caches.open(CACHE_ASET);

    // NETWORK-FIRST, bukan cache-first.
    //
    // Aset build selalu diambil dari jaringan lebih dulu supaya perubahan
    // CSS/JS langsung terpakai. Cache HANYA cadangan saat offline.
    //
    // Versi lama memakai cache-first + SWR. Itu bocor: nama berkas berhash
    // berubah tiap build (app-ABC.css -> app-XYZ.css), jadi kalau HTML yang
    // tersimpan di cache masih menunjuk nama LAMA, cache terus menyajikan
    // aset lama itu selamanya dan perbaikan UI tidak pernah sampai ke
    // pengguna — persis kasus nav bottom yang "masih sama" di PWA.
    try {
        const res = await fetch(request, { cache: 'no-cache' });
        if (res && res.ok) {
            // simpan salinan untuk offline; jangan tahan respons bila gagal
            cache.put(request, res.clone()).catch(() => {});
        }
        return res;
    } catch (e) {
        const cadangan = await cache.match(request);
        if (cadangan) return cadangan;
        throw e;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // hanya GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // ---------- 1. Tile WMS lewat proxy ----------
    if (url.pathname === '/geo-proxy') {
        const req = (url.searchParams.get('request')
            || url.searchParams.get('REQUEST')
            || '').toUpperCase();

        if (req === 'GETMAP' || req === 'GETLEGENDGRAPHIC') {
            event.respondWith(cacheDulu(request, CACHE_TILE, BATAS_TILE));
            return;
        }

        // GetFeatureInfo / GetFeature / GetCapabilities: harus segar
        return;
    }

    // ---------- 2. Tile basemap eksternal: DIBIARKAN ----------
    //
    // Tile OSM/Google dimuat <img> tanpa crossorigin -> request 'no-cors',
    // respons opaque (status 0). Cache API tidak bisa diandalkan untuk
    // request seperti ini: cache.put() bisa melempar, dan versi sebelumnya
    // mengubahnya menjadi respons 504 sehingga PETA BLANK total
    // ("leaflet maupun satelit").
    //
    // Browser sudah punya cache HTTP sendiri untuk gambar. SW tidak perlu
    // ikut campur. Keuntungan offline untuk tile tetap didapat dari cache
    // HTTP browser; yang benar-benar penting untuk offline (halaman, aset,
    // tile WMS lewat /geo-proxy) tetap ditangani di blok lain.
    if (/tile\.openstreetmap\.org|mt\d\.google\.com/.test(url.hostname)) {
        return;
    }

    // ---------- 3. Aset build -> stale-while-revalidate ----------
    if (url.origin === self.location.origin && url.pathname.startsWith('/build/')) {
        event.respondWith(asetBuild(request, event));
        return;
    }

    // ---------- 4. Navigasi halaman ----------
    if (request.mode === 'navigate') {
        event.respondWith(jaringanDulu(request));
        return;
    }

    // ---------- 5. Aset statis lain (font, css CDN) ----------
    // JANGAN dicache oleh SW.
    //
    // Respons cross-origin dari <link>/<script> bersifat OPAQUE (no-cors):
    // status selalu 0 dan res.ok selalu false. Saat disimpan lalu dibaca
    // kembali, pengecekan `res.ok` gagal dan SW mengembalikan error ->
    // jQuery/Leaflet/font gagal dimuat -> window.map bukan objek Leaflet ->
    // "window.map.on is not a function" -> halaman blank.
    //
    // Biarkan browser mengurus cache HTTP-nya sendiri.
    if (url.origin !== self.location.origin) {
        return;
    }
});

/** Terima perintah dari halaman (mis. bersihkan cache). */
self.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'LEWATI_TUNGGU') {
        self.skipWaiting();
    }

    if (data.type === 'BERSIHKAN_CACHE') {
        event.waitUntil((async () => {
            const nama = await caches.keys();
            await Promise.all(nama.filter(n => n.startsWith('webgis-')).map(n => caches.delete(n)));
            if (event.source) event.source.postMessage({ type: 'CACHE_DIBERSIHKAN' });
        })());
    }
});
