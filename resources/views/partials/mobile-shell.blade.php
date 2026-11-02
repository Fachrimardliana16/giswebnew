{{--
    Bottom navigation — hanya tampil di mobile (<=767px).
    Tab: Peta, Layer (buka bottom sheet), Cari, Akun.
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
            data-nav="layer" data-sheet-open aria-controls="sidebar" aria-expanded="false">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5"></path>
        </svg>
        <span>Layer</span>
        <span class="mobile-nav__badge" data-layer-badge>0</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="cari" data-focus-search data-sheet-close>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span>Cari</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="akun" data-profile-open data-sheet-close>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>Akun</span>
    </button>
</nav>

{{-- Backdrop bottom sheet --}}
<div class="sheet-backdrop" data-sheet-backdrop data-sheet-close aria-hidden="true"></div>

{{-- FAB: aksi cepat di atas peta --}}
<div class="mobile-fab" data-fab>
    <button type="button" class="mobile-fab__btn" data-basemap-fab
            aria-label="Ganti tampilan peta" title="Ganti tampilan peta">
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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
