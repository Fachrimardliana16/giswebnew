{{--
    Splash aplikasi (layar tunggu).
    Menutupi seluruh layar (termasuk header & nav) sehingga terlihat seperti
    splash aplikasi native, bukan halaman web kosong.

    Ditutup oleh resources/js/gis/splash.js setelah peta siap.
--}}
<div id="appSplash" class="app-splash" role="status" aria-live="polite" aria-label="Memuat aplikasi">
    <div class="app-splash__inner">
        <div class="app-splash__logo">
            <img src="/icons/icon-192.png" alt="" width="56" height="56">
        </div>
        <h1 class="app-splash__judul">WEB<span>GIS</span></h1>
        <p class="app-splash__sub">Tirta Perwira</p>
        <div class="app-splash__bar" aria-hidden="true"><span></span></div>
        <p class="app-splash__teks">Menyiapkan peta…</p>
    </div>
</div>

<noscript><style>#appSplash{display:none!important}</style></noscript>
