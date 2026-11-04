/**
 * Camera AR — service data spasial.
 *
 * Mengambil fitur pipa di sekitar posisi pengguna dari GeoServer WFS lewat
 * /geo-proxy (sudah ada, sudah menyaring parameter & membatasi 50 fitur).
 *
 * Kenapa BBOX +/- 50 m, bukan radius lingkaran?
 * - WFS mendukung bbox sehingga pemfilteran terjadi di server (PostGIS),
 *   bukan di browser. Untuk radius 50 m, kotak 100x100 m hanya sedikit
 *   lebih besar dari lingkarannya dan jauh lebih murah.
 *
 * Kenapa ada cache di IndexedDB?
 * - Sinyal di lapangan sering hilang. Data pipa yang sudah pernah diambil
 *   untuk area tertentu disimpan, sehingga AR tetap bisa menampilkan jalur
 *   walau jaringan mati (PRD bagian 7: mitigasi sinyal lemah).
 */

import { GEOSERVER_WFS_URL } from '../config.js';

/** Radius pencarian dalam meter. */
export const RADIUS_M = 50;

/**
* Radius query AR (meter). Lebih besar dari JARAK_MAKS (10 m) supaya saat
* pengguna berada tepat di tepi jangkauan, pipa di depannya tetap terbaca
* sebelum watchPosition memperbarui posisi.
*/
export const RADIUS_AR = 15;

/** Nama layer WFS yang dipakai AR. */
export const LAYER_AR = 'webgis:web_pipa';

/** Layer pelanggan — ditampilkan sebagai titik acuan di sekitar pengguna. */
export const LAYER_PELANGGAN = 'webgis:analisa_pelanggan';

/**
 * Layer aksesoris (semua bertipe Point). Dipakai tombol switch di panel AR.
 * Kolom tiap layer berbeda (dia / diameter / diamater), jadi pembacaan
 * atribut dibuat toleran — lihat bacaAtributAksesoris().
 */
export const LAYER_AKSESORIS = [
    { id: 'airvalve', wfs: 'webgis:all_airvalve', label: 'Air Valve' },
    { id: 'gatevalve', wfs: 'webgis:all_gatevalve', label: 'Gate Valve' },
    { id: 'washout', wfs: 'webgis:all_washout', label: 'Wash Out' },
    { id: 'tee', wfs: 'webgis:all_tee', label: 'Tee' },
    { id: 'firehydrant', wfs: 'webgis:all_firehydrant', label: 'Fire Hydrant' },
    { id: 'prv', wfs: 'webgis:all_prv', label: 'PRV' },
    { id: 'meterinduk', wfs: 'webgis:all_meterinduk', label: 'Meter Induk' },
];

/** Nama tampilan satu objek aksesoris. */
export function bacaAtributAksesoris(fitur, labelJenis = 'Aksesoris') {
    const p = fitur?.properties || {};
    const ambil = (...k) => {
        for (const key of k) {
            const v = p[key];
            if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
        }
        return null;
    };

    return {
        jenis: labelJenis,
        diameter: ambil('dia', 'diameter', 'diamater', 'diapipa'),
        alamat: ambil('alamat'),
        kondisi: ambil('kondisi', 'kodisi'),
    };
}

/** Atribut yang dibutuhkan badge (PRD FR-05). */
const ATRIBUT = ['jenis', 'material', 'diameter', 'kedalaman', 'nama', 'kode'];

const DB_NAME = 'webgis-ar';
const DB_STORE = 'pipa';

/* ---------------- IndexedDB (cache offline) ---------------- */

function bukaDb() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) return resolve(null);
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE); // key = kunci area
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Kunci cache: grid 100 m supaya geser sedikit tetap memakai entri yang sama. */
function kunciArea(lat, lng) {
    const grid = RADIUS_M * 2; // 100 m
    const latK = Math.round((lat * 111320) / grid);
    const lngK = Math.round((lng * 111320 * Math.cos((lat * Math.PI) / 180)) / grid);
    return `pipa:${latK}:${lngK}`;
}

async function simpanCache(key, data) {
    try {
        const db = await bukaDb();
        if (!db) return;
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({ waktu: Date.now(), data }, key);
    } catch (e) {
        /* cache bersifat opsional */
    }
}

async function ambilCache(key) {
    try {
        const db = await bukaDb();
        if (!db) return null;
        return await new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, 'readonly');
            const req = tx.objectStore(DB_STORE).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) {
        return null;
    }
}

/* ---------------- Pengambilan data ---------------- */

/**
 * Kotak BBOX +/- radius meter di sekitar titik.
 * @returns {string} "minLng,minLat,maxLng,maxLat" (EPSG:4326, urutan WFS 1.1.0)
 */
export function bboxSekitar(lat, lng, radius = RADIUS_M) {
    const dLat = radius / 111320;
    const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180));
    return [lng - dLng, lat - dLat, lng + dLng, lat + dLat]
        .map((v) => v.toFixed(7))
        .join(',');
}

/**
 * Ambil fitur pipa GeoJSON di sekitar posisi.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {{signal?: AbortSignal, pakaiCache?: boolean}} opsi
 * @returns {Promise<{features: Array, sumber: 'jaringan'|'cache', waktu: number}>}
 */
export async function ambilPipaSekitar(lat, lng, opsi = {}) {
    const { signal, pakaiCache = true, radius = RADIUS_AR } = opsi;
    const key = kunciArea(lat, lng);

    const url = new URL(GEOSERVER_WFS_URL, window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '1.1.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typename', LAYER_AR);
    url.searchParams.set('outputformat', 'application/json');
    url.searchParams.set('srsname', 'EPSG:4326');
    url.searchParams.set('bbox', `${bboxSekitar(lat, lng, radius)},EPSG:4326`);
    url.searchParams.set('maxfeatures', '50');

    try {
        const res = await fetch(url.toString(), {
            signal,
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        });

        if (!res.ok) throw new Error(`WFS ${res.status}`);
        const json = await res.json();
        const features = Array.isArray(json.features) ? json.features : [];

        if (pakaiCache) simpanCache(key, features);
        return { features, sumber: 'jaringan', waktu: Date.now() };
    } catch (err) {
        if (err.name === 'AbortError') throw err;

        // Jaringan gagal -> pakai data area yang pernah diambil
        const cached = pakaiCache ? await ambilCache(key) : null;
        if (cached && Array.isArray(cached.data)) {
            return { features: cached.data, sumber: 'cache', waktu: cached.waktu };
        }
        throw err;
    }
}

/**
 * Ambil titik pelanggan di sekitar posisi.
 *
 * Dipakai sebagai acuan visual: petugas sering tahu posisi pelanggan
 * (meteran di dinding rumah), jadi titik ini membantu memastikan arah
 * hadap HP sudah benar sebelum mempercayai garis pipa.
 */
export async function ambilPelangganSekitar(lat, lng, radius = RADIUS_M) {
    const url = new URL(GEOSERVER_WFS_URL, window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '1.1.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typename', LAYER_PELANGGAN);
    url.searchParams.set('outputformat', 'application/json');
    url.searchParams.set('srsname', 'EPSG:4326');
    url.searchParams.set('bbox', `${bboxSekitar(lat, lng, radius)},EPSG:4326`);
    url.searchParams.set('maxfeatures', '20');
    url.searchParams.set('propertyname', 'nama,nolang,geom');

    try {
        const res = await fetch(url.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json.features) ? json.features : [];
    } catch (e) {
        return [];
    }
}

/**
 * Ambil semua aksesoris di sekitar, digabung jadi satu daftar.
 *
 * Tujuh layer = tujuh request. Dijalankan paralel agar total waktu tetap
 * di bawah ±1 detik; layer yang gagal/kosong diabaikan, bukan menggagalkan
 * keseluruhan.
 *
 * @returns {Promise<Array>} fitur, masing-masing diberi properti semu
 *   `__jenis` berisi label tampilan (Air Valve, Gate Valve, ...).
 */
export async function ambilAksesorisSekitar(lat, lng, radius = RADIUS_AR) {
    const kotak = `${bboxSekitar(lat, lng, radius)},EPSG:4326`;

    const permintaan = LAYER_AKSESORIS.map(async (lap) => {
        const url = new URL(GEOSERVER_WFS_URL, window.location.origin);
        url.searchParams.set('service', 'WFS');
        url.searchParams.set('version', '1.1.0');
        url.searchParams.set('request', 'GetFeature');
        url.searchParams.set('typename', lap.wfs);
        url.searchParams.set('outputformat', 'application/json');
        url.searchParams.set('srsname', 'EPSG:4326');
        url.searchParams.set('bbox', kotak);
        url.searchParams.set('maxfeatures', '20');

        try {
            const res = await fetch(url.toString(), {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            });
            if (!res.ok) return [];
            const json = await res.json();
            const features = Array.isArray(json.features) ? json.features : [];
            features.forEach((f) => {
                f.properties = { ...(f.properties || {}), __jenis: lap.label };
            });
            return features;
        } catch (e) {
            return [];
        }
    });

    const hasil = await Promise.all(permintaan);
    return hasil.flat();
}

/** Normalisasi properti fitur jadi badge yang siap tampil. */
export function bacaAtribut(fitur) {
    const p = fitur?.properties || {};
    const ambil = (...kandidat) => {
        for (const k of kandidat) {
            const v = p[k];
            if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
        }
        return null;
    };

    return {
        jenis: ambil('jenis', 'material', 'type', 'nama'),
        diameter: ambil('diameter', 'dia', 'ukuran'),
        kedalaman: ambil('kedalaman', 'depth', 'kedalaman_m'),
    };
}

/** Daftar kunci atribut yang dipakai (untuk diagnostik). */
export const atributDipakai = ATRIBUT.slice();
