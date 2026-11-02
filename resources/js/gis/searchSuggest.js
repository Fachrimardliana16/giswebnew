/**
 * Saran pencarian pelanggan (autocomplete).
 *
 * Mengetik "herlan" -> muncul daftar nama yang mengandung HERLAN
 * beserta nomor langganannya. Begitu juga bila yang diketik angka
 * (nolang). Diambil dari WFS GeoServer lewat /geo-proxy.
 */

import { GEOSERVER_WFS_URL } from './config.js';

const MIN_CHAR = 2;
const JEDA_KETIK = 320;     // ms
const MAKS_SARAN = 8;

let timer = null;
let abortCtrl = null;
let indeksAktif = -1;
let daftarSaran = [];

const bersihkan = (s) => String(s).replace(/[<>&"']/g, '');

function bangunCQL(teks) {
    const q = teks.trim().toUpperCase().replace(/'/g, "''");
    const hanyaAngka = /^[0-9]+$/.test(teks.trim());

    if (hanyaAngka) {
        // cari nomor langganan lebih dulu, nama sebagai cadangan
        return `nolang LIKE '${teks.trim()}%' OR strToUpperCase(nama) LIKE '%${q}%'`;
    }
    return `strToUpperCase(nama) LIKE '%${q}%' OR nolang LIKE '${teks.trim()}%'`;
}

async function ambilSaran(teks) {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'webgis:analisa_pelanggan',
        maxFeatures: String(MAKS_SARAN),
        outputFormat: 'application/json',
        propertyName: 'nama,nolang,alamat,cabang',
        cql_filter: bangunCQL(teks),
    });

    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    const res = await fetch(`${GEOSERVER_WFS_URL}?${params.toString()}`, {
        signal: abortCtrl.signal,
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.features || []).map(f => f.properties || {}).filter(p => p.nama || p.nolang);
}

function sorotTeks(teks, kata) {
    const aman = bersihkan(teks);
    if (!kata) return aman;
    const re = new RegExp('(' + kata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return aman.replace(re, '<mark>$1</mark>');
}

export function initSearchSuggest(input, panel, onPilih) {
    if (!input || !panel) return;

    const tutup = () => {
        panel.setAttribute('data-open', '0');
        panel.innerHTML = '';
        indeksAktif = -1;
        daftarSaran = [];
        input.setAttribute('aria-expanded', 'false');
    };

    const gambar = (items, kata) => {
        if (!items.length) {
            panel.innerHTML = `<div class="fsug__kosong">Tidak ada pelanggan cocok</div>`;
            panel.setAttribute('data-open', '1');
            return;
        }

        panel.innerHTML = items.map((p, i) => `
            <button type="button" class="fsug__item" role="option" data-idx="${i}"
                    aria-selected="${i === indeksAktif ? 'true' : 'false'}"
                    data-nama="${bersihkan(p.nama || '')}">
                <span class="fsug__row1">
                    <span class="fsug__nama">${sorotTeks(p.nama || '-', kata)}</span>
                    <span class="fsug__nolang">${bersihkan(p.nolang || '')}</span>
                </span>
                <span class="fsug__row2">${bersihkan(p.alamat || '')}${
                    p.cabang ? ' · ' + bersihkan(p.cabang) : ''
                }</span>
            </button>
        `).join('');

        panel.setAttribute('data-open', '1');
        input.setAttribute('aria-expanded', 'true');

        panel.querySelectorAll('.fsug__item').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();     // jangan sampai input blur dulu
                const p = items[parseInt(btn.dataset.idx, 10)];
                pilih(p);
            });
        });
    };

    const pilih = (p) => {
        if (!p) return;
        // isi dengan nomor langganan agar tepat sasaran
        input.value = p.nolang || p.nama || '';
        tutup();
        onPilih && onPilih(p);
    };

    const cari = async () => {
        const teks = input.value.trim();
        if (teks.length < MIN_CHAR) { tutup(); return; }

        try {
            daftarSaran = await ambilSaran(teks);
            indeksAktif = -1;
            gambar(daftarSaran, teks);
        } catch (e) {
            if (e.name !== 'AbortError') console.warn('saran gagal', e);
        }
    };

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(cari, JEDA_KETIK);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= MIN_CHAR && daftarSaran.length) {
            panel.setAttribute('data-open', '1');
        }
    });

    input.addEventListener('keydown', (e) => {
        const terbuka = panel.getAttribute('data-open') === '1';
        if (!terbuka || !daftarSaran.length) {
            if (e.key === 'Escape') tutup();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            indeksAktif = Math.min(indeksAktif + 1, daftarSaran.length - 1);
            gambar(daftarSaran, input.value.trim());
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            indeksAktif = Math.max(indeksAktif - 1, 0);
            gambar(daftarSaran, input.value.trim());
        } else if (e.key === 'Enter' && indeksAktif >= 0) {
            e.preventDefault();
            e.stopPropagation();
            pilih(daftarSaran[indeksAktif]);
        } else if (e.key === 'Escape') {
            tutup();
        }
    });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== input) tutup();
    });
}
