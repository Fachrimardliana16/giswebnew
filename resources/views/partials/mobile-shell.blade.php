{{--
    Bottom navigation — hanya tampil di mobile (<=767px).
    Tab: Peta, Pelanggan, Pipa & Asesoris, Cari, Akun.
--}}
<nav class="mobile-nav" data-bottom-nav role="tablist" aria-label="Navigasi utama">
    <button type="button" class="mobile-nav__item" role="tab" aria-selected="true"
            data-nav="peta" data-sheet-close>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0021 17.882V8.118a2 2 0 00-1.447-1.894L15 4m0 13V4m0 0L9 1"></path>
        </svg>
        <span>Peta</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="pelanggan" data-sheet-open="pelanggan" aria-controls="sidebar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <span>Pelanggan</span>
        <span class="mobile-nav__badge" data-badge="pelanggan">0</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="pipa" data-sheet-open="pipa" aria-controls="sidebar">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 6h6v6H4V6zm10 0h6v6h-6V6zM4 16h6v4H4v-4zm10 0h6v4h-6v-4z"></path>
        </svg>
        <span>Pipa</span>
        <span class="mobile-nav__badge" data-badge="pipa">0</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="cari" data-search-open>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>Cari</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="akun" data-profile-open>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>Akun</span>
    </button>
</nav>

{{-- Backdrop bottom sheet --}}
<div class="sheet-backdrop" data-sheet-backdrop data-sheet-close aria-hidden="true"></div>

{{-- FAB: aksi cepat, di ATAS agar tidak menutupi zoom Leaflet.
     Tombol peta = toggle langsung Peta Jalan <-> Satelit. --}}
<div class="mobile-fab" data-fab>
    <button type="button" class="mobile-fab__btn" data-basemap-toggle
            aria-label="Ganti antara peta jalan dan satelit" title="Ganti peta">
        <svg class="mobile-fab__icon mobile-fab__icon--peta" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0021 17.882V8.118a2 2 0 00-1.447-1.894L15 4m0 13V4m0 0L9 1"></path>
        </svg>
        <svg class="mobile-fab__icon mobile-fab__icon--satelit" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
    </button>
    <button type="button" class="mobile-fab__btn mobile-fab__btn--primary" data-location-fab
            aria-label="Tampilkan lokasi saya" title="Lokasi saya">
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
    </button>
</div>

{{-- Sheet pilihan basemap --}}
<div class="basemap-sheet" data-basemap-sheet aria-hidden="true">
    <div class="basemap-sheet__panel">
        <div class="basemap-sheet__handle"></div>
        <h3 class="basemap-sheet__title">Tampilan Peta</h3>
        <div class="basemap-sheet__opsi" role="radiogroup" aria-label="Pilih tampilan peta">
            <button type="button" class="basemap-sheet__item" data-basemap="osm" role="radio" aria-checked="true">
                <span class="basemap-sheet__preview basemap-sheet__preview--osm"></span>
                <span class="basemap-sheet__label">Peta Jalan</span>
                <svg class="basemap-sheet__check" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
            </button>
            <button type="button" class="basemap-sheet__item" data-basemap="satelit" role="radio" aria-checked="false">
                <span class="basemap-sheet__preview basemap-sheet__preview--satelit"></span>
                <span class="basemap-sheet__label">Satelit</span>
                <svg class="basemap-sheet__check" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
            </button>
        </div>
        <button type="button" class="basemap-sheet__tutup" data-basemap-tutup>Batal</button>
    </div>
</div>
