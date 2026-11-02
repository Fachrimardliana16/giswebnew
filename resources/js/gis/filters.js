/**
 * Titik masuk filter peta.
 *
 * Dulu satu file 319 baris mencampur tiga domain. Sekarang dipecah:
 *   filters/pelanggan.js  — status, cabang, tarif, kubikasi, tunggakan, umur WM, rayon, cater
 *   filters/pipa.js       — material, jenis jaringan, unit IKK, diameter, sumber air
 *   filters/pengaduan.js  — status & tahun pengaduan
 *   cql.js                — pembangun ekspresi CQL (murni, bisa diuji)
 */

import { setupFilterPelanggan } from './filters/pelanggan.js';
import { setupFilterPipa } from './filters/pipa.js';
import { setupFilterPengaduan } from './filters/pengaduan.js';

export function initFilters(map, layers) {
    setupFilterPelanggan(map, layers);
    setupFilterPipa(map, layers);
    setupFilterPengaduan(map, layers);
}
