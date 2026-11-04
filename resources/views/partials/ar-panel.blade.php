{{--
    Camera AR — panel fullscreen (PRD FR-01).
    Berisi: stream kamera belakang, kanvas overlay, status GPS, slider
    kalibrasi kompas, dan tombol tutup.

    Panel ini sengaja selalu ada di DOM (bukan dibuat lewat JS) supaya
    CSP tanpa 'unsafe-inline' tidak jadi masalah dan transisi CSS-nya
    bisa dianimasikan.
--}}
<div id="arPanel" class="ar-panel" data-open="0" aria-hidden="true" role="dialog" aria-modal="true"
     aria-label="Kamera AR tampilan bawah tanah">

    {{-- Stream kamera belakang --}}
    <video id="arVideo" class="ar-video" autoplay muted playsinline></video>

    {{-- Overlay garis pipa --}}
    <canvas id="arCanvas" class="ar-canvas" aria-hidden="true"></canvas>

    {{-- Kepala: status + tombol tutup --}}
    <div class="ar-head">
        <div class="ar-head__kiri">
            <span class="ar-badge-live">AR</span>
            <span id="arStatus" class="ar-status" role="status" aria-live="polite">Menyiapkan…</span>
        </div>
        <button type="button" class="ar-tutup" data-ar-tutup aria-label="Tutup kamera AR">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    </div>

    {{-- Switch lapisan data — RINGKAS: hanya ikon + titik status.
         Label lengkap ada di aria-label & tooltip, bukan di layar. --}}
    <div class="ar-switch" role="group" aria-label="Pilih data yang ditampilkan">
        <button type="button" class="ar-switch__btn" data-ar-layer="pipa"
                role="switch" aria-checked="true" title="Pipa" aria-label="Tampilkan pipa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" aria-hidden="true">
                <path d="M3 12h18M6 9v6M18 9v6"></path>
            </svg>
            <span class="ar-switch__jml" data-ar-jumlah="pipa">0</span>
        </button>
        <button type="button" class="ar-switch__btn" data-ar-layer="pelanggan"
                role="switch" aria-checked="true" title="Pelanggan" aria-label="Tampilkan pelanggan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2"></circle>
                <path d="M5.5 20a6.5 6.5 0 0113 0"></path>
            </svg>
            <span class="ar-switch__jml" data-ar-jumlah="pelanggan">0</span>
        </button>
        <button type="button" class="ar-switch__btn" data-ar-layer="aksesoris"
                role="switch" aria-checked="true" title="Aksesoris" aria-label="Tampilkan aksesoris">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" aria-hidden="true">
                <rect x="7" y="7" width="10" height="10" rx="2"></rect>
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path>
            </svg>
            <span class="ar-switch__jml" data-ar-jumlah="aksesoris">0</span>
        </button>
    </div>

    {{-- Indikator pendukung --}}
    <div class="ar-indikator">
        <span id="arAkurasi" class="ar-chip" data-baik="0">GPS —</span>
        <span id="arSumber" class="ar-chip ar-chip--sumber">Data live</span>
    </div>

    {{-- Panah penunjuk arah pipa terdekat (muncul bila pipa di luar pandangan) --}}
    <div id="arPenunjuk" class="ar-penunjuk" data-show="0" aria-hidden="true">
        <span class="ar-penunjuk__panah">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7"></path>
            </svg>
        </span>
        <span id="arPenunjukTeks" class="ar-penunjuk__teks">Putar ke kanan</span>
    </div>

    {{-- Tombol bantuan: menjelaskan arti layar dalam satu kartu --}}
    <button type="button" id="arBantuanBtn" class="ar-bantuan-btn" aria-label="Cara pakai AR"
            aria-controls="arBantuan" aria-expanded="false">?</button>
    <div id="arBantuan" class="ar-bantuan" data-open="0" aria-hidden="true">
        <h3 class="ar-bantuan__judul">Cara membaca layar AR</h3>
        <ul class="ar-bantuan__daftar">
            <li><b>Garis putus-putus biru</b> = perkiraan jalur pipa di bawah tanah.</li>
            <li><b>Garis tanah</b> = batas permukaan jalan. Garis pipa di bawahnya berarti pipanya tertanam lebih dalam.</li>
            <li><b>Kartu kuning</b> = jenis pipa, diameter, kedalaman, dan jarak dari posisi Anda.</li>
            <li><b>Angka U/T/S/B</b> = arah mata angin, untuk memastikan kompas tidak melenceng.</li>
            <li><b>Slider jarak</b> = mengatur seberapa jauh pipa ditampilkan (5–50 m).</li>
            <li><b>Arah otomatis</b> = kompas + giroskop HP, tidak perlu dikalibrasi manual.</li>
        </ul>
        <button type="button" class="ar-bantuan__tutup" data-ar-bantuan-tutup>Mengerti</button>
    </div>

    {{-- Palung bawah: JARAK PANDANG dinamis.
         Kompas tidak lagi dikalibrasi manual — heading diambil otomatis dari
         kompas + giroskop. Yang perlu disesuaikan di lapangan adalah seberapa
         jauh pipa ditampilkan. --}}
    <div class="ar-bawah">
        <div class="ar-kalibrasi">
            <div class="ar-kalibrasi__label">
                <span>Jarak tampil</span>
                <span id="arJarakNilai" class="ar-kalibrasi__nilai">10 m</span>
            </div>
            <input id="arJarak" class="ar-slider" type="range" min="5" max="50" step="5" value="10"
                   aria-label="Atur jarak tampil pipa dalam meter"
                   aria-valuetext="10 meter">
            <div class="ar-jarak-cepat" role="group" aria-label="Pilih jarak cepat">
                <button type="button" class="ar-jarak-chip" data-jarak="5">5 m</button>
                <button type="button" class="ar-jarak-chip" data-jarak="10" aria-pressed="true">10 m</button>
                <button type="button" class="ar-jarak-chip" data-jarak="20">20 m</button>
                <button type="button" class="ar-jarak-chip" data-jarak="50">50 m</button>
            </div>
            <p class="ar-kalibrasi__hint">Semakin dekat, semakin akurat untuk menggali.</p>
        </div>
    </div>
</div>
