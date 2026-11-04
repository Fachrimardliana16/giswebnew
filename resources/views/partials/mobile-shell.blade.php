{{--
    Bottom navigation — hanya tampil di mobile (<=767px).
    Urutan: Pelanggan | Pengaduan | PETA (tengah, mencolok) | Jaringan | Aksesoris
--}}
<nav class="mobile-nav" data-bottom-nav role="tablist" aria-label="Navigasi utama">
    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="pelanggan" data-sheet-open="pelanggan" aria-controls="sidebar"
            aria-label="Data pelanggan">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <span>Pelanggan</span>
        <span class="mobile-nav__badge" data-badge="pelanggan">0</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="pengaduan" data-sheet-open="pengaduan" aria-controls="sidebar"
            aria-label="Data pengaduan">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>Pengaduan</span>
        <span class="mobile-nav__badge" data-badge="pengaduan">0</span>
    </button>

    {{-- Tengah: CAMERA AR (bukan tab lagi).
         Klik = tutup sheet lalu buka panel AR (kamera belakang + garis pipa).
         Tombol refresh peta dipindah ke header, di kanan kotak pencarian.

         DIMATIKAN SEMENTARA (menunggu rilis berikutnya).
         Kodenya sengaja TIDAK dihapus. Flag $tampilkanCameraAR didefinisikan
         di dashboard.blade.php — ubah di sana menjadi true untuk
         memunculkan tombol beserta fungsinya lagi.
         Tombol tidak dirender sama sekali (bukan sekadar hidden), supaya
         slot tengah bottom nav tidak menyisakan ruang kosong. --}}
    @if (!empty($tampilkanCameraAR))
        <button type="button" class="mobile-nav__item mobile-nav__item--peta" role="button"
                data-nav="peta" data-sheet-close data-ar-buka aria-label="Buka kamera AR">
            <span class="mobile-nav__peta-bulat">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M3 8V6a2 2 0 012-2h2M17 4h2a2 2 0 012 2v2M21 16v2a2 2 0 01-2 2h-2M7 20H5a2 2 0 01-2-2v-2"></path>
                    <circle cx="12" cy="12" r="3.2" stroke-linecap="round"></circle>
                </svg>
            </span>
            <span>Camera AR</span>
        </button>
    @endif

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="jaringan" data-sheet-open="jaringan" aria-controls="sidebar"
            aria-label="Jaringan pipa">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 6h6v6H4V6zm10 0h6v6h-6V6zM4 16h6v4H4v-4zm10 0h6v4h-6v-4z"></path>
        </svg>
        <span>Jaringan</span>
        <span class="mobile-nav__badge" data-badge="jaringan">0</span>
    </button>

    <button type="button" class="mobile-nav__item" role="tab" aria-selected="false"
            data-nav="aksesoris" data-sheet-open="aksesoris" aria-controls="sidebar"
            aria-label="Aksesoris jaringan">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <span>Aksesoris</span>
        <span class="mobile-nav__badge" data-badge="aksesoris">0</span>
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

{{-- Sheet pilihan basemap (dipakai tombol desktop) --}}
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
