import { createWMSLayer } from './config.js';

/**
 * Daftar layer yang dikenali aplikasi.
 * Konfigurasi khusus hanya untuk layer yang memang butuh.
 */
const DEFINISI = {
  analisa_pelanggan: { format: 'image/png', transparent: true, tiled: true },
  web_pipa: {
    // Awalnya sembunyikan semua (1=2) sampai user memilih filter
    cql_filter: '1=2',
    zIndex: 400,
    tiled: true,
    buffer: 0,
  },
  monitoring_pengaduan: { format: 'image/png', transparent: true, tiled: true },

  all_airvalve: {},
  all_bend: {},
  all_checkvalve: {},
  all_dop: {},
  all_firehydrant: {},
  all_gatevalve: {},
  all_meterinduk: {},
  all_prv: {},
  all_reducer: {},
  all_strainer: {},
  all_tee: {},
  all_titik_tekanan: {},
  all_washout: {},
};

const ID = Object.keys(DEFINISI);

export const daftarIdLayer = () => ID.slice();

/**
 * Direktori layer dengan LAZY INITIALISATION.
 *
 * Sebelumnya ke-17 layer dibuat saat halaman dimuat, padahal biasanya hanya
 * 1-2 yang dicentang. Setiap L.tileLayer.wms memasang event handler dan
 * menyiapkan generator URL — membuang kerja untuk layer yang tak pernah dipakai.
 *
 * Sekarang layer baru dibuat saat benar-benar diakses (dicentang / difilter).
 *
 * Catatan penting: memakai Proxy, BUKAN objek dengan getter enumerable.
 * Objek getter biasa akan terpicu oleh Object.keys()/for-in sehingga semua
 * layer tetap dibuat — persis yang ingin dihindari. Proxy memberi daftar kunci
 * tanpa menyentuh nilainya.
 */
export const initLayers = () => {
  const dibuat = {};

  const ambil = (id) => {
    if (!DEFINISI[id]) return undefined;
    if (!dibuat[id]) {
      dibuat[id] = createWMSLayer(id, DEFINISI[id]);
    }
    return dibuat[id];
  };

  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === '__jumlahDibuat') return () => Object.keys(dibuat).length;
      if (prop === '__sudahDibuat') return (id) => Boolean(dibuat[id]);
      if (prop === '__daftar') return () => ID.slice();
      if (typeof prop !== 'string') return undefined;
      return ambil(prop);
    },

    has(_target, prop) {
      return typeof prop === 'string' && ID.includes(prop);
    },

    ownKeys() {
      // daftar kunci tanpa memicu pembuatan layer
      return ID.slice();
    },

    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== 'string' || !ID.includes(prop)) return undefined;
      return { enumerable: true, configurable: true };
    },
  });

  return proxy;
};

/**
 * Berapa layer yang benar-benar sudah dibuat (untuk diagnostik).
 */
export const jumlahLayerDibuat = (layers) =>
  (layers && typeof layers.__jumlahDibuat === 'function') ? layers.__jumlahDibuat() : -1;
