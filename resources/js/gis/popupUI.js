/**
 * Popup detail fitur (pelanggan, pipa, asesoris, pengaduan).
 *
 * Dirancang ulang agar informatif: status berwarna, ringkasan angka besar,
 * kelompok data (Identitas / Pemakaian / Tagihan / Water Meter), dan aksi
 * cepat (navigasi, salin koordinat).
 */

const sanitizeHTML = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const angka = (v) => {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
};

const rupiah = (v) => {
    const n = angka(v);
    if (n === null) return '-';
    return 'Rp ' + n.toLocaleString('id-ID');
};

const LABEL = {
    nolang: 'No. Langganan',
    nama: 'Nama',
    alamat: 'Alamat',
    rayon: 'Rayon',
    cabang: 'Cabang',
    tarif: 'Tarif',
    status: 'Status',
    drd_pemakaian: 'Pemakaian',
    tungg_lembar: 'Tunggakan',
    tungg_rptagihan: 'Total Tagihan',
    tungg_cicilan: 'Cicilan',
    tgllunas: 'Tgl Lunas',
    bacameter_tglbaca: 'Tgl Baca',
    bacameter_namacater: 'Petugas Baca',
    wm_noseri: 'No. Seri WM',
    wm_merk: 'Merek WM',
    wm_tglgantimeter: 'Tgl Ganti WM',
    umurwm_tahun: 'Umur WM',
    isvalid: 'Validasi',
    debit: 'Debit',
    jenis: 'Material',
    jnsjringan: 'Jenis Jaringan',
    unitikk: 'Unit / IKK',
    diameter: 'Diameter',
    sumberma: 'Sumber Air',
    compliantstatusid: 'Status Pengaduan',
    datecompliant: 'Tanggal Lapor',
};

/** Status pelanggan PDAM: 1 Baru, 2 Aktif, 3 Tutup Sementara, 4 Tutup Permanen, 5 Bongkar Segel */
const STATUS = {
    '1': { teks: 'Baru (SR)', warna: '#2563eb', bg: '#dbeafe' },
    '2': { teks: 'Aktif Normal', warna: '#059669', bg: '#d1fae5' },
    '3': { teks: 'Tutup Sementara', warna: '#d97706', bg: '#fef3c7' },
    '4': { teks: 'Tutup Permanen', warna: '#dc2626', bg: '#fee2e2' },
    '5': { teks: 'Bongkar Segel', warna: '#7c3aed', bg: '#ede9fe' },
};

const TARIF = {
    '1': 'ABRI/TNI Polri', '2': 'TNI Yonif 406 CK', '3': 'Industri Kecil',
    '4': 'Industri Besar', '5': 'Inst. Pemerintah', '6': 'Niaga Kecil',
    '7': 'Niaga Besar', '8': 'Rumah Tangga A', '9': 'Rumah Tangga B',
    '10': 'Rumah Tangga C', '11': 'Sosial Umum', '12': 'Sosial Khusus',
    '13': 'RT Serang', '14': 'Sosial Umum KRJ', '15': 'RT Kutabawa',
    '16': 'RT KRETE', '17': 'RT Khusus',
};

const KELOMPOK = [
    {
        judul: 'Identitas',
        ikon: '<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>',
        kunci: ['nolang', 'alamat', 'rayon', 'cabang', 'tarif', 'unitikk', 'jenis', 'jnsjringan', 'diameter', 'sumberma', 'datecompliant'],
    },
    {
        judul: 'Pemakaian',
        ikon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
        kunci: ['drd_pemakaian', 'debit', 'bacameter_tglbaca', 'bacameter_namacater'],
    },
    {
        judul: 'Tagihan',
        ikon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>',
        kunci: ['tungg_lembar', 'tungg_rptagihan', 'tungg_cicilan', 'tgllunas'],
    },
    {
        judul: 'Water Meter',
        ikon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        kunci: ['wm_noseri', 'wm_merk', 'wm_tglgantimeter', 'umurwm_tahun', 'isvalid'],
    },
];

function formatNilai(key, value) {
    if (value === null || value === undefined || value === '') return '-';
    const k = key.toLowerCase();

    if (k === 'tungg_rptagihan' || k === 'tungg_cicilan') return rupiah(value);

    if (k === 'drd_pemakaian') {
        const n = angka(value);
        return n === null ? sanitizeHTML(value) : `${n.toLocaleString('id-ID')} m³`;
    }
    if (k === 'debit') {
        const n = angka(value);
        return n === null ? sanitizeHTML(value) : `${n.toFixed(2)} L/detik`;
    }
    if (k === 'umurwm_tahun') return `${sanitizeHTML(value)} th`;
    if (k === 'diameter') return `Ø ${sanitizeHTML(value)} mm`;
    if (k === 'tarif') {
        const t = TARIF[String(value).trim()];
        return t ? sanitizeHTML(t) : sanitizeHTML(value);
    }
    if (k === 'isvalid') {
        const ya = value === true || value === 'true' || value === 1 || value === '1';
        return ya ? 'Valid' : 'Belum valid';
    }
    if (k.includes('tgl') || k === 'datecompliant') {
        const s = String(value).replace(/Z$/, '');
        const d = new Date(s);
        if (!isNaN(d)) {
            return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return sanitizeHTML(s.replace('T', ' ').slice(0, 16));
    }
    return sanitizeHTML(value);
}

function baris(label, nilaiHTML) {
    return `<div class="fpop__row">
        <span class="fpop__k">${sanitizeHTML(label)}</span>
        <span class="fpop__v">${nilaiHTML}</span>
    </div>`;
}

/**
 * @param {string} title  judul utama (nama pelanggan / nama layer)
 * @param {Object} props  properti fitur dari GeoServer
 * @param {number} lat
 * @param {number} lng
 * @returns {string} HTML popup
 */
export function renderFeaturePopup(title, props, lat, lng) {
    props = props || {};
    const judul = sanitizeHTML(String(title || 'Detail Informasi').replace(/_/g, ' '));

    const idKey = (k) => k.toLowerCase();
    const ambil = (nama) => {
        const target = idKey(nama);
        for (const k of Object.keys(props)) {
            if (idKey(k) === target) return props[k];
        }
        return undefined;
    };

    // ---- Status & ringkasan ----
    const statusRaw = ambil('status');
    const st = statusRaw !== undefined ? STATUS[String(statusRaw).trim()] : null;

    const pemakaian = angka(ambil('drd_pemakaian'));
    const tunggakan = angka(ambil('tungg_lembar'));
    const tagihan = angka(ambil('tungg_rptagihan'));
    const nolang = ambil('nolang');

    const kartu = [];
    if (pemakaian !== null) {
        kartu.push({ label: 'Pemakaian', nilai: `${pemakaian.toLocaleString('id-ID')}`, satuan: 'm³',
                     warna: '#2563eb', bg: '#eff6ff' });
    }
    if (tunggakan !== null) {
        const bahaya = tunggakan > 0;
        kartu.push({ label: 'Tunggakan', nilai: `${tunggakan.toLocaleString('id-ID')}`, satuan: 'bln',
                     warna: bahaya ? '#dc2626' : '#059669', bg: bahaya ? '#fef2f2' : '#ecfdf5' });
    }
    if (tagihan !== null) {
        kartu.push({ label: 'Tagihan', nilai: rupiah(tagihan).replace('Rp ', ''), satuan: 'Rp',
                     warna: tagihan > 0 ? '#d97706' : '#059669',
                     bg: tagihan > 0 ? '#fffbeb' : '#ecfdf5' });
    }

    // ---- Kelompok data ----
    const sudahDipakai = new Set();
    ['nama', 'status', 'drd_pemakaian', 'tungg_lembar', 'tungg_rptagihan'].forEach(k => sudahDipakai.add(k));

    let kelompokHTML = '';
    KELOMPOK.forEach(grup => {
        const isi = [];
        grup.kunci.forEach(k => {
            const v = ambil(k);
            if (v === undefined || v === null || v === '') return;
            sudahDipakai.add(k);
            isi.push(baris(LABEL[k] || k.replace(/_/g, ' '), formatNilai(k, v)));
        });
        if (!isi.length) return;

        kelompokHTML += `
            <section class="fpop__grup">
                <h4 class="fpop__grup-judul">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">${grup.ikon}</svg>
                    ${grup.judul}
                </h4>
                ${isi.join('')}
            </section>`;
    });

    // ---- Sisa properti yang belum ditampilkan ----
    const sisa = [];
    Object.keys(props).forEach(k => {
        const lk = idKey(k);
        if (sudahDipakai.has(lk)) return;
        if (['id', 'geom', 'geometry', 'id_0', 'objectid', 'shape_leng', 'shape_area', 'fid',
             'point_x', 'point_y', 'nama', 'boundedby'].includes(lk)) return;
        const v = props[k];
        if (v === null || v === undefined || v === '') return;
        sisa.push(baris(LABEL[lk] || lk.replace(/_/g, ' '), formatNilai(k, v)));
    });

    if (sisa.length) {
        kelompokHTML += `
            <section class="fpop__grup">
                <h4 class="fpop__grup-judul">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10"/>
                    </svg>
                    Informasi Lain
                </h4>
                ${sisa.join('')}
            </section>`;
    }

    const koordinat = (typeof lat === 'number' && typeof lng === 'number')
        ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '-';

    const navUrl = (typeof lat === 'number' && typeof lng === 'number')
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null;

    return `
    <div class="fpop">
        <header class="fpop__head">
            <div class="fpop__head-top">
                <span class="fpop__badge">Detail</span>
                ${st ? `<span class="fpop__status" style="color:${st.warna};background:${st.bg}">
                    <span class="fpop__dot" style="background:${st.warna}"></span>${sanitizeHTML(st.teks)}
                </span>` : ''}
            </div>
            <h3 class="fpop__nama">${judul}</h3>
            ${nolang !== undefined ? `<p class="fpop__nolang">No. Langganan <b>${sanitizeHTML(nolang)}</b></p>` : ''}
        </header>

        ${kartu.length ? `
        <div class="fpop__kartu">
            ${kartu.map(k => `
                <div class="fpop__kartu-item" style="background:${k.bg}">
                    <span class="fpop__kartu-label">${k.label}</span>
                    <span class="fpop__kartu-nilai" style="color:${k.warna}">${k.nilai}
                        <small>${k.satuan}</small></span>
                </div>`).join('')}
        </div>` : ''}

        <div class="fpop__isi">${kelompokHTML}</div>

        <footer class="fpop__foot">
            <div class="fpop__koord">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>${koordinat}</span>
            </div>
            ${navUrl ? `<a class="fpop__nav" href="${navUrl}" target="_blank" rel="noopener">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0021 17.882V8.118a2 2 0 00-1.447-1.894L15 4m0 13V4m0 0L9 1"/>
                </svg>
                Navigasi
            </a>` : ''}
        </footer>
    </div>`;
}
