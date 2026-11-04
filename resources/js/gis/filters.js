/**
 * Titik masuk filter peta.
 *
 * Dulu satu file 319 baris mencampur tiga domain. Sekarang dipecah:
 *   filters/pelanggan.js  — status, cabang, tarif, kubikasi, tunggakan, umur WM, rayon, cater,
 *                           isvalid, lunas/belum lunas
 *   filters/pipa.js       — material, jenis jaringan, unit IKK, diameter, sumber air
 *   filters/pengaduan.js  — status & tahun pengaduan
 *   filters/aksesoris.js  — kondisi, diameter, isvalid untuk 13 layer all_*  [FITUR BARU]
 *   cql.js                — pembangun ekspresi CQL (murni, bisa diuji)
 */

import { setupFilterPelanggan } from './filters/pelanggan.js';
import { setupFilterPipa } from './filters/pipa.js';
import { setupFilterPengaduan } from './filters/pengaduan.js';
// --- FITUR BARU ---
import { setupFilterAksesoris } from './filters/aksesoris.js';

export function initFilters(map, layers) {
    setupFilterPelanggan(map, layers);
    setupFilterPipa(map, layers);
    setupFilterPengaduan(map, layers);
    // --- FITUR BARU ---
    setupFilterAksesoris(map, layers);
}
