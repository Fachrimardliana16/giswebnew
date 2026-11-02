/**
 * Mobile app shell: bottom navigation, bottom sheet, FAB, search di header.
 * Hanya aktif di <=767px. Desktop tidak terpengaruh.
 */

const SHEET_SELECTOR = '#sidebar';
const MQ = '(max-width: 767px)';

const isMobile = () => window.matchMedia(MQ).matches;
const getSheet = () => document.querySelector(SHEET_SELECTOR);
const getBackdrop = () => document.querySelector('[data-sheet-backdrop]');

function setTabAktif(nama) {
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.setAttribute('aria-selected', btn.dataset.nav === nama ? 'true' : 'false');
    });
}

/* ---------------- Filter isi sheet per tab ---------------- */

function terapkanFilterSheet(mode) {
    const sheet = getSheet();
    if (!sheet) return;

    const map = {
        pelanggan: ['pelanggan', 'jaringan'],
        pipa: ['jaringan_pipa', 'aksesoris'],
    };
    const tampil = map[mode] || null;

    sheet.querySelectorAll('[data-section-toggle]').forEach(header => {
        const id = header.dataset.sectionToggle;
        // pembungkus section = parent dari header
        const wrapper = header.parentElement;
        if (!wrapper) return;
        wrapper.style.display = (!tampil || tampil.includes(id)) ? '' : 'none';
    });

    // Buka otomatis section yang relevan: kalau dibiarkan tertutup,
    // sheet tampak kosong meski sudah difilter.
    if (tampil) {
        tampil.forEach(id => {
            const content = document.getElementById('content-' + id);
            const icon = document.getElementById('icon-' + id);
            const header = sheet.querySelector(`[data-section-toggle="${id}"]`);
            if (content && content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                if (icon) icon.classList.add('rotate-180');
                if (header) header.setAttribute('aria-expanded', 'true');
            }
        });
    }

    // Sembunyikan blok navigasi admin saat mode filter aktif
    const navAdmin = sheet.querySelector('.px-2.mb-6');
    if (navAdmin) navAdmin.style.display = tampil ? 'none' : '';
}

function resetFilterSheet() {
    const sheet = getSheet();
    if (!sheet) return;
    sheet.querySelectorAll('[data-section-toggle]').forEach(h => {
        const w = h.parentElement;
        if (w) w.style.display = '';
    });
    const navAdmin = sheet.querySelector('.px-2.mb-6');
    if (navAdmin) navAdmin.style.display = '';
}

/* ---------------- Bottom sheet ---------------- */

export function bukaSheet(mode = null) {
    const sheet = getSheet();
    const backdrop = getBackdrop();
    if (!sheet || !isMobile()) return;

    if (mode) terapkanFilterSheet(mode);
    else resetFilterSheet();

    sheet.dataset.open = '1';
    sheet.dataset.mode = mode || '';
    sheet.removeAttribute('aria-hidden');
    if (backdrop) backdrop.dataset.open = '1';
    document.body.style.overflow = 'hidden';

    const judul = {
        pelanggan: ['Data Pelanggan', 'Filter & tampilkan data pelanggan'],
        pipa: ['Jaringan & Asesoris', 'Pilih pipa, sumber air, dan asesoris'],
    };
    const t = mode && judul[mode] ? judul[mode] : ['Layer', 'Pilih data yang ingin ditampilkan'];
    const elJudul = document.getElementById('sheetTitle');
    const elSub = document.getElementById('sheetSubtitle');
    if (elJudul) elJudul.textContent = t[0];
    if (elSub) elSub.textContent = t[1];

    const fokusable = sheet.querySelector('input:not([type=hidden]), select');
    if (fokusable) {
        setTimeout(() => fokusable.focus({ preventScroll: true }), 340);
    }
}

export function tutupSheet() {
    const sheet = getSheet();
    const backdrop = getBackdrop();
    if (!sheet) return;

    sheet.dataset.open = '0';
    sheet.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.dataset.open = '0';
    document.body.style.overflow = '';
    resetFilterSheet();
}

export function toggleSheet(mode) {
    const sheet = getSheet();
    if (!sheet) return;
    if (sheet.dataset.open === '1' && sheet.dataset.mode === (mode || '')) tutupSheet();
    else bukaSheet(mode);
}

function pasangDrag() {
    const sheet = getSheet();
    const handle = document.querySelector('[data-sheet-handle]');
    if (!sheet || !handle) return;

    let startY = 0, delta = 0, dragging = false;

    const mulai = (y) => {
        if (!isMobile()) return;
        startY = y; delta = 0; dragging = true;
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

/* ---------------- Basemap: toggle langsung ---------------- */

/**
 * State basemap disimpan di #baseMapLabel (dipakai map.js):
 * label 'Satelit' = sedang Peta Jalan (klik berikutnya -> satelit).
 */
function segarkanStateBasemap() {
    const label = document.getElementById('baseMapLabel');
    if (!label) return;
    const sedangOsm = label.textContent.trim() === 'Satelit';
    document.body.dataset.basemap = sedangOsm ? 'osm' : 'satelit';
}

function siapkanBasemap() {
    // Tombol FAB: satu klik langsung menukar peta
    document.querySelectorAll('[data-basemap-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('baseMapToggle')?.click();
            // map.js memperbarui label secara sinkron, tapi beri jeda 1 frame
            requestAnimationFrame(() => {
                segarkanStateBasemap();
                const sekarang = document.body.dataset.basemap === 'satelit' ? 'Satelit' : 'Peta Jalan';
                window.showToast?.('Tampilan: ' + sekarang, 'info', 1600);
            });
        });
    });

    // Tombol desktop membuka sheet pilihan (perilaku lama dipertahankan)
    document.querySelectorAll('[data-basemap-fab-desktop]').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = document.querySelector('[data-basemap-sheet]');
            if (!s) return;
            s.dataset.open = '1';
            s.removeAttribute('aria-hidden');
        });
    });

    const tutupSheetBasemap = () => {
        const s = document.querySelector('[data-basemap-sheet]');
        if (s) {
            s.dataset.open = '0';
            s.setAttribute('aria-hidden', 'true');
        }
    };
    document.querySelectorAll('[data-basemap-tutup]').forEach(b => b.addEventListener('click', tutupSheetBasemap));

    const s = document.querySelector('[data-basemap-sheet]');
    if (s) {
        s.addEventListener('click', (e) => {
            if (e.target.closest('.basemap-sheet__panel')) return;
            tutupSheetBasemap();
        });
    }

    // Opsi di dalam sheet (desktop)
    document.querySelectorAll('[data-basemap]').forEach(opt => {
        opt.addEventListener('click', () => {
            const target = opt.dataset.basemap;
            const sedangOsm = document.body.dataset.basemap !== 'satelit';

            if ((target === 'satelit' && sedangOsm) || (target === 'osm' && !sedangOsm)) {
                document.getElementById('baseMapToggle')?.click();
            }

            document.querySelectorAll('[data-basemap]').forEach(o => {
                o.setAttribute('aria-checked', o.dataset.basemap === target ? 'true' : 'false');
            });

            requestAnimationFrame(segarkanStateBasemap);
            setTimeout(tutupSheetBasemap, 180);
        });
    });

    segarkanStateBasemap();
}

/* ---------------- Search di header (default tertutup) ---------------- */

function searchHeader() {
    const panel = document.getElementById('mobileHeaderSearch');
    const input = document.getElementById('mobileFloatSearch');
    const clear = document.getElementById('mobileHeaderSearchClear');
    const form = document.getElementById('mobileHeaderSearchForm');
    const toggle = document.getElementById('mobileSearchToggle');
    const asli = document.getElementById('customerSearchInput');
    const asliBtn = document.getElementById('searchButton');
    if (!panel || !input || !asli || !asliBtn) return;

    const buka = () => {
        panel.dataset.open = '1';
        panel.removeAttribute('aria-hidden');
        toggle?.setAttribute('aria-expanded', 'true');
        document.body.classList.add('fab-turun');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                input.focus();
                input.select();
            });
        });
    };

    const tutup = () => {
        panel.dataset.open = '0';
        panel.setAttribute('aria-hidden', 'true');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('fab-turun');
        input.blur();
    };

    const tutupKalauKosong = () => {
        if (!input.value.trim()) tutup();
    };

    toggle?.addEventListener('click', (e) => {
        e.preventDefault();
        if (panel.dataset.open === '1') tutup();
        else { tutupSheet(); buka(); }
    });

    clear?.addEventListener('click', () => {
        input.value = '';
        input.focus();
    });

    const jalankan = () => {
        const q = input.value.trim();
        if (!q) { tutup(); return; }
        asli.value = q;
        asliBtn.click();
        tutup();
        setTabAktif('peta');
    };

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        jalankan();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') tutup();
        if (e.key === 'Enter') { e.preventDefault(); jalankan(); }
    });

    // Tab Cari di bottom nav juga membuka panel yang sama
    document.querySelectorAll('[data-search-open]').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            tutupSheet();
            setTabAktif('cari');
            buka();
        });
    });

    // Klik peta menutup panel bila kosong
    document.getElementById('map')?.addEventListener('click', tutupKalauKosong);

    return { buka, tutup };
}

/* ---------------- Badge per kategori ---------------- */

function pantauBadge() {
    const hitung = () => {
        const pelanggan = document.querySelectorAll(
            '.pelanggan-checkbox:checked, .pengduan-checkbox:checked'
        ).length;
        const pipa = document.querySelectorAll(
            '.pipa-checkbox:checked, .pipa-sumberma-checkbox:checked, .aksesoris-checkbox:checked'
        ).length;

        const set = (nama, n) => {
            const b = document.querySelector(`[data-badge="${nama}"]`);
            if (!b) return;
            b.textContent = n;
            b.dataset.show = n > 0 ? '1' : '0';
        };
        set('pelanggan', pelanggan);
        set('pipa', pipa);
    };

    document.addEventListener('change', (e) => {
        const c = e.target.classList;
        if (c && (c.contains('pelanggan-checkbox') || c.contains('pengduan-checkbox') ||
                  c.contains('pipa-checkbox') || c.contains('pipa-sumberma-checkbox') ||
                  c.contains('aksesoris-checkbox'))) hitung();
    });

    ['selectAllPipa', 'uncheckAllPipa', 'selectAllSumberma', 'uncheckAllSumberma',
     'selectAllAksesoris', 'uncheckAllAksesoris'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => setTimeout(hitung, 60));
    });

    hitung();
}

/* ---------------- Inisialisasi ---------------- */

export function initMobileApp() {
    document.querySelectorAll('[data-sheet-open]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = btn.dataset.sheetOpen || null;
            const sheet = getSheet();
            if (sheet?.dataset.open === '1' && sheet.dataset.mode === (mode || '')) {
                tutupSheet();
                setTabAktif('peta');
            } else {
                bukaSheet(mode);
                setTabAktif(btn.dataset.nav);
            }
        });
    });

    document.querySelectorAll('[data-sheet-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tutupSheet();
            setTabAktif('peta');
        });
    });

    document.querySelectorAll('[data-nav="peta"]').forEach(btn => {
        btn.addEventListener('click', () => {
            tutupSheet();
            setTabAktif('peta');
        });
    });

    // Tab Akun -> profil bottom sheet
    document.querySelectorAll('[data-profile-open]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tutupSheet();
            setTabAktif('akun');
            setTimeout(() => {
                const pt = document.getElementById('profileToggle');
                const pd = document.getElementById('profileDropdown');
                if (pt && pd && pd.classList.contains('hidden')) pt.click();
            }, 180);
        });
    });

    const backdrop = getBackdrop();
    if (backdrop) backdrop.addEventListener('click', () => {
        tutupSheet();
        setTabAktif('peta');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            tutupSheet();
            const panel = document.getElementById('mobileHeaderSearch');
            if (panel) panel.dataset.open = '0';
            const bs = document.querySelector('[data-basemap-sheet]');
            if (bs) bs.dataset.open = '0';
        }
    });

    const mq = window.matchMedia(MQ);
    const sesuaikan = () => {
        const sheet = getSheet();
        if (!sheet) return;
        if (!mq.matches) {
            sheet.removeAttribute('data-open');
            sheet.removeAttribute('data-dragging');
            sheet.style.transform = '';
            sheet.removeAttribute('aria-hidden');
            resetFilterSheet();
            const bd = getBackdrop();
            if (bd) bd.dataset.open = '0';
            document.body.style.overflow = '';
            const panel = document.getElementById('mobileHeaderSearch');
            if (panel) panel.dataset.open = '0';
        }
    };
    mq.addEventListener('change', sesuaikan);
    sesuaikan();

    pasangDrag();
    siapkanBasemap();
    searchHeader();
    pantauBadge();
}

window.bukaSheetMobile = bukaSheet;
window.tutupSheetMobile = tutupSheet;
