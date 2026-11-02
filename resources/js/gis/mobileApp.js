/**
 * Mobile app shell: bottom navigation, bottom sheet, FAB.
 *
 * Semua hanya aktif di <=767px. Di desktop kelas/atribut dibiarkan
 * tapi CSS menyembunyikannya, jadi tidak mengganggu layout lama.
 */

const SHEET_SELECTOR = '#sidebar';
const MQ = '(max-width: 767px)';

const isMobile = () => window.matchMedia(MQ).matches;

function getSheet() {
    return document.querySelector(SHEET_SELECTOR);
}

function getBackdrop() {
    return document.querySelector('[data-sheet-backdrop]');
}

function setTabAktif(nama) {
    document.querySelectorAll('[data-nav]').forEach(btn => {
        const aktif = btn.dataset.nav === nama;
        btn.setAttribute('aria-selected', aktif ? 'true' : 'false');
    });
    const layerBtn = document.querySelector('[data-sheet-open]');
    if (layerBtn) layerBtn.setAttribute('aria-expanded', nama === 'layer' ? 'true' : 'false');
}

/* ---------------- Bottom sheet ---------------- */

export function bukaSheet() {
    const sheet = getSheet();
    const backdrop = getBackdrop();
    if (!sheet || !isMobile()) return;

    sheet.dataset.open = '1';
    sheet.removeAttribute('aria-hidden');
    if (backdrop) backdrop.dataset.open = '1';
    document.body.style.overflow = 'hidden';
    setTabAktif('layer');

    // beri fokus ke elemen pertama yang bisa difokus agar keyboard bekerja
    const fokusable = sheet.querySelector('input, select, button');
    if (fokusable) setTimeout(() => fokusable.focus({ preventScroll: true }), 320);
}

export function tutupSheet() {
    const sheet = getSheet();
    const backdrop = getBackdrop();
    if (!sheet) return;

    sheet.dataset.open = '0';
    sheet.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.dataset.open = '0';
    document.body.style.overflow = '';
    setTabAktif('peta');
}

export function toggleSheet() {
    const sheet = getSheet();
    if (!sheet) return;
    if (sheet.dataset.open === '1') tutupSheet();
    else bukaSheet();
}

/**
 * Drag untuk menutup sheet: geser ke bawah > 120px menutup,
 * geser ke atas membuka penuh.
 */
function pasangDrag() {
    const sheet = getSheet();
    const handle = document.querySelector('[data-sheet-handle]');
    if (!sheet || !handle) return;

    let startY = 0;
    let delta = 0;
    let dragging = false;

    const mulai = (y) => {
        if (!isMobile()) return;
        startY = y;
        delta = 0;
        dragging = true;
        sheet.dataset.dragging = '1';
    };

    const gerak = (y) => {
        if (!dragging) return;
        delta = Math.max(0, y - startY);
        sheet.style.transform = `translateY(${delta}px)`;
    };

    const selesai = () => {
        if (!dragging) return;
        dragging = false;
        sheet.dataset.dragging = '0';
        sheet.style.transform = '';
        if (delta > 120) tutupSheet();
    };

    handle.addEventListener('touchstart', (e) => mulai(e.touches[0].clientY), { passive: true });
    handle.addEventListener('touchmove', (e) => gerak(e.touches[0].clientY), { passive: true });
    handle.addEventListener('touchend', selesai);
    handle.addEventListener('touchcancel', selesai);

    handle.addEventListener('mousedown', (e) => {
        mulai(e.clientY);
        const mm = (ev) => gerak(ev.clientY);
        const mu = () => {
            selesai();
            window.removeEventListener('mousemove', mm);
            window.removeEventListener('mouseup', mu);
        };
        window.addEventListener('mousemove', mm);
        window.addEventListener('mouseup', mu);
    });
}

/* ---------------- FAB ---------------- */

function pasangFab() {
    const basemap = document.querySelector('[data-basemap-fab]');
    const lokasi = document.querySelector('[data-location-fab]');
    const basemapAsli = document.getElementById('baseMapToggle');
    const lokasiAsli = document.getElementById('getLocationBtn');

    // Teruskan klik ke kontrol asli supaya logika tetap satu sumber
    if (basemap && basemapAsli) {
        basemap.addEventListener('click', () => basemapAsli.click());
    }
    if (lokasi && lokasiAsli) {
        lokasi.addEventListener('click', () => lokasiAsli.click());
    }
}

/* ---------------- Search melayang ---------------- */

function pasangSearchFloat() {
    const input = document.getElementById('mobileFloatSearch');
    const btn = document.getElementById('mobileFloatSearchBtn');
    const asli = document.getElementById('customerSearchInput');
    const asliBtn = document.getElementById('searchButton');
    if (!input || !asli || !asliBtn) return;

    const jalankan = () => {
        const q = input.value.trim();
        if (!q) return;
        asli.value = q;
        asliBtn.click();
        input.blur();
        setTabAktif('peta');
    };

    if (btn) btn.addEventListener('click', jalankan);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            jalankan();
        }
    });
}

/* ---------------- Badge jumlah layer aktif ---------------- */

function pantauBadge() {
    const badge = document.querySelector('[data-layer-badge]');
    if (!badge) return;

    const hitung = () => {
        const n = document.querySelectorAll('.layer-checkbox:checked, .pipa-checkbox:checked, .pipa-sumberma-checkbox:checked').length;
        badge.textContent = n;
        badge.dataset.show = n > 0 ? '1' : '0';
    };

    document.addEventListener('change', (e) => {
        if (e.target.classList && (
            e.target.classList.contains('layer-checkbox') ||
            e.target.classList.contains('pipa-checkbox') ||
            e.target.classList.contains('pipa-sumberma-checkbox')
        )) hitung();
    });

    // tombol pilih semua / hapus semua
    ['selectAllPipa', 'uncheckAllPipa', 'selectAllSumberma', 'uncheckAllSumberma',
     'selectAllAksesoris', 'uncheckAllAksesoris'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => setTimeout(hitung, 50));
    });

    hitung();
}

/* ---------------- Inisialisasi ---------------- */

export function initMobileApp() {
    // Tab navigasi
    document.querySelectorAll('[data-sheet-open]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            bukaSheet();
        });
    });

    document.querySelectorAll('[data-sheet-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tutupSheet();

            if (btn.hasAttribute('data-profile-open')) {
                // buka dropdown profil setelah sheet tertutup
                setTimeout(() => {
                    const pt = document.getElementById('profileToggle');
                    const pd = document.getElementById('profileDropdown');
                    if (pt && pd) {
                        if (pd.classList.contains('hidden')) pt.click();
                    }
                }, 200);
            }

            if (btn.hasAttribute('data-focus-search')) {
                setTimeout(() => {
                    document.getElementById('mobileFloatSearch')?.focus();
                }, 200);
            }
        });
    });

    // Tombol Peta: pastikan sheet tertutup
    document.querySelectorAll('[data-nav="peta"]').forEach(btn => {
        btn.addEventListener('click', () => tutupSheet());
    });

    // Backdrop
    const backdrop = getBackdrop();
    if (backdrop) backdrop.addEventListener('click', tutupSheet);

    // Escape menutup sheet
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') tutupSheet();
    });

    // Pindah ke desktop: bersihkan state sheet
    const mq = window.matchMedia(MQ);
    const sesuaikan = () => {
        const sheet = getSheet();
        if (!sheet) return;
        if (!mq.matches) {
            sheet.removeAttribute('data-open');
            sheet.removeAttribute('data-dragging');
            sheet.style.transform = '';
            sheet.removeAttribute('aria-hidden');
            const bd = getBackdrop();
            if (bd) bd.dataset.open = '0';
            document.body.style.overflow = '';
        }
    };
    mq.addEventListener('change', sesuaikan);
    sesuaikan();

    pasangDrag();
    pasangFab();
    pasangSearchFloat();
    pantauBadge();
}

// diekspor untuk tombol lama (sidebarToggle) agar konsisten
window.bukaSheetMobile = bukaSheet;
window.tutupSheetMobile = tutupSheet;
