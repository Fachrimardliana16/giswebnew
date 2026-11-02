<?php

return [
    /*
    | URL GeoServer. Tanpa nilai default ber-IP: kalau .env lupa diisi,
    | aplikasi harus gagal jelas, bukan diam-diam menembak server produksi.
    */
    'geoserver_url' => env('GIS_GEOSERVER_URL'),
    'geoserver_wfs_url' => env('GIS_GEOSERVER_WFS_URL'),

    /*
    | Verifikasi sertifikat TLS ke GeoServer. Hanya set false bila upstream
    | memakai sertifikat self-signed DAN jaringan internal tepercaya.
    */
    'geoserver_verify_tls' => env('GIS_GEOSERVER_VERIFY_TLS', true),

    'default_lat' => env('GIS_DEFAULT_LAT', -7.385735),
    'default_lng' => env('GIS_DEFAULT_LNG', 109.360430),
    'default_zoom' => env('GIS_DEFAULT_ZOOM', 11),

    'pipe_sizes' => [400, 300, 250, 200, 150, 100, 75, 65, 50, 40, 25, 20, 15],

    'accessories' => [
        'all_airvalve' => 'Air Valve',
        'all_bend' => 'Bend',
        'all_checkvalve' => 'Check Valve',
        'all_dop' => 'Dop',
        'all_firehydrant' => 'Fire Hydrant',
        'all_gatevalve' => 'Gate Valve',
        'all_meterinduk' => 'Meter Induk',
        'all_prv' => 'PRV',
        'all_reducer' => 'Reducer',
        'all_strainer' => 'Strainer',
        'all_tee' => 'Tee',
        'all_titik_tekanan' => 'Titik Tekanan',
        'all_washout' => 'Washout',
    ],
];
