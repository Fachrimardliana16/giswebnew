<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeoServerProxyController extends Controller
{
    /**
     * Parameter yang boleh diteruskan ke GeoServer.
     * Apa pun di luar daftar ini dibuang, sehingga klien tidak bisa
     * menyelundupkan parameter vendor/otomisasi ke upstream.
     */
    private const ALLOWED_PARAMS = [
        'service', 'version', 'request', 'layers', 'query_layers', 'styles',
        'format', 'transparent', 'srs', 'crs', 'bbox', 'width', 'height',
        'x', 'y', 'info_format', 'typename', 'outputformat', 'cql_filter',
        'maxfeatures', 'count', 'propertyname', 'sortby', 'exceptions', 'bgcolor',
    ];

    /**
     * Kolom yang boleh dikirim ke browser untuk GetFeature, PER TYPENAME.
     *
     * Sebelumnya hanya ada satu daftar berisi kolom pelanggan, lalu daftar itu
     * dipaksa ke SEMUA layer. Akibatnya GetFeature untuk webgis:web_pipa ditolak
     * GeoServer ("Requested property: nama is not available") sehingga Camera AR
     * dan pencarian pipa selalu gagal.
     *
     * Daftar analisa_pelanggan di bawah WAJIB memuat semua kolom yang dipakai
     * popup pelanggan. Sebelumnya daftar ini hanya berisi identitas
     * (nama/alamat/tarif), sehingga popup menampilkan Pemakaian, Tunggakan,
     * dan Total Tagihan sebagai 0 walau GeoServer punya nilainya — kolomnya
     * dipotong di proxy sebelum sampai ke browser.
     * Nama kolom dicek terhadap DescribeFeatureType, bukan dikira-kira:
     * 'wm_noseri' (bukan wm_no_seri), 'wm_tglgantimeter' (bukan tglgantimeter).
     */
    private const WFS_PROPERTIES_PER_LAYER = [
        'analisa_pelanggan' => [
            // identitas
            'nama', 'nolang', 'rayon', 'alamat', 'tarif', 'status', 'cabang',
            'isvalid', 'keterangan',
            // pemakaian & tagihan (dipakai popupUI.js)
            'drd_pemakaian', 'lama', 'baru',
            'tungg_lembar', 'tungg_rptagihan', 'tungg_cicilan', 'tgllunas',
            'bacameter_tglbaca', 'bacameter_namacater',
            // meter air
            'wm_noseri', 'wm_merk', 'wm_tglgantimeter',
            // dokumentasi lapangan
            'fotorumah', 'fotowm',
            'geom',
        ],
        'web_pipa' => [
            'id', 'geom', 'diameter', 'jenis', 'merk', 'tglpasang', 'nospk',
            'sumberdana', 'panjang', 'kedalaman', 'standar', 'jnsjringan',
            'drafter', 'sumberma', 'unitikk', 'dma', 'isvalid',
        ],
    ];

    /** Kolom yang boleh dikirim ke browser untuk GetFeature. */
    private const WFS_PROPERTIES = [
        'nama', 'nolang', 'rayon', 'alamat', 'tarif', 'status', 'cabang',
        'drd_pemakaian', 'tungg_lembar', 'tungg_rptagihan', 'tungg_cicilan',
        'tgllunas', 'bacameter_tglbaca', 'bacameter_namacater', 'isvalid',
        'debit', 'umurwm_tahun', 'wm_noseri', 'wm_merk', 'wm_tglgantimeter',
    ];

    private const MAX_FEATURES = 50;

    /**
     * Batas fitur untuk permintaan yang HANYA meminta geometri.
     *
     * Zoom otomatis (autoZoom.js) perlu menghitung kotak pembatas hasil
     * filter. Dengan MAX_FEATURES=50 sampelnya terlalu sedikit: extent
     * bisa meleset karena 50 titik teratas semuanya dari satu kelurahan.
     *
     * Aman dinaikkan karena kolom lain tidak dikirim — responsnya hanya
     * berisi geometri (terukur 0,9 MB untuk 5000 titik), bukan seluruh
     * atribut seperti GetFeature biasa.
     *
     * 5000 dipilih dari pengukuran, bukan tebakan: untuk filter
     * isvalid=false, 1500 sampel membuat extent meleset 0,12 derajat
     * (~13 km, data terpotong), sedangkan 5000 sampel sama persis dengan
     * hasil seluruh data dan tetap selesai 0,5 detik.
     */
    private const MAX_FEATURES_GEOM_ONLY = 5000;

    private const MAX_DIMENSION = 4096;

    private const MAX_CQL_LENGTH = 1000;

    /**
     * Umur cache tile di disk (detik). 7 hari.
     */
    private const UMUR_CACHE = 604800;

    /** Jumlah berkas cache maksimum sebelum pembersihan (LRU sederhana). */
    private const MAKS_BERKAS_CACHE = 6000;

    /**
     * Batas ukuran satu tile yang BOLEH masuk cache (byte).
     *
     * AUDIT PERFORMA: sebelumnya tidak ada batas ukuran. Satu permintaan
     * GetMap 4096x4096 bisa menghasilkan berkas ratusan KB sampai beberapa MB;
     * dengan 6000 berkas izin, cache bisa membengkak sampai jutaan MB dan
     * memenuhi disk hosting.
     *
     * 512 KB cukup untuk tile 256-1024 px yang dipakai aplikasi. Tile lebih
     * besar tetap dilayani, hanya tidak disimpan.
     */
    private const MAKS_UKURAN_TILE_CACHE = 524288;

    /**
     * Lokasi berkas cache tile.
     *
     * Disimpan di storage/framework/cache/geotile, di luar public/, supaya
     * tidak bisa diakses langsung lewat URL.
     */
    private function pathCache(string $kunci): string
    {
        $dir = storage_path('framework/cache/geotile');

        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        // subfolder dua tingkat supaya satu folder tidak berisi ribuan berkas
        return $dir.DIRECTORY_SEPARATOR.substr($kunci, 0, 2).DIRECTORY_SEPARATOR.$kunci.'.png';
    }

    /** Buang berkas cache terlama bila jumlahnya melebihi batas. */
    private function rapikanCache(): void
    {
        $dir = storage_path('framework/cache/geotile');
        if (! is_dir($dir)) {
            return;
        }

        $semua = glob($dir.'/*/*.png') ?: [];
        if (count($semua) <= self::MAKS_BERKAS_CACHE) {
            return;
        }

        // urutkan dari yang paling lama diakses
        usort($semua, fn ($a, $b) => filemtime($a) <=> filemtime($b));
        $lebih = count($semua) - self::MAKS_BERKAS_CACHE;

        foreach (array_slice($semua, 0, $lebih) as $berkas) {
            @unlink($berkas);
        }
    }

    /**
     * Proxy request ke GeoServer untuk menghindari Mixed Content.
     */
    public function proxy(Request $request)
    {
        // --- AUDIT KEAMANAN: wajib login -------------------------------
        // Sebelumnya endpoint ini terbuka: siapa pun yang tahu URL-nya bisa
        // memakai server sebagai proxy GeoServer (open proxy) — menghabiskan
        // bandwidth dan membebani upstream, tanpa meninggalkan jejak siapa.
        //
        // Dicek di controller (bukan middleware grup auth) supaya permintaan
        // tile yang di-cache service worker tidak menerima redirect 302 ke
        // /login. Klien mendapat 401 yang jelas.
        if (! Auth::check()) {
            return response()->json(['error' => 'Tidak terautentikasi'], 401);
        }

        $params = $this->filterParams($request->query());
        $operation = strtoupper($params['request'] ?? '');

        if ($operation === '') {
            return response()->json(['error' => 'Parameter request wajib diisi'], 400);
        }

        if ($operation === 'GETFEATURE') {
            $params = $this->limitWfs($params);
        }

        if ($operation === 'GETMAP') {
            if (! $this->dimensionsAllowed($params)) {
                return response()->json(['error' => 'Ukuran gambar melebihi batas'], 413);
            }
        }

        if (isset($params['cql_filter'])) {
            $cql = (string) $params['cql_filter'];

            if (strlen($cql) > self::MAX_CQL_LENGTH) {
                return response()->json(['error' => 'cql_filter terlalu panjang'], 400);
            }

            if (! $this->cqlLooksSafe($cql)) {
                return response()->json(['error' => 'cql_filter tidak valid'], 400);
            }

            // JANGAN meng-escape kutip: GeoServer menolak 'x''y'. Kutip yang
            // tidak seimbang sudah ditolak oleh cqlLooksSafe().
            $params['cql_filter'] = $cql;
        }

        $isWfs = strtoupper($params['service'] ?? '') === 'WFS';
        $targetUrl = $isWfs
            ? config('gis.geoserver_wfs_url')
            : config('gis.geoserver_url');

        if (! $targetUrl) {
            Log::error('GeoServer proxy: URL target belum dikonfigurasi');

            return response()->json(['error' => 'Konfigurasi GeoServer belum lengkap'], 500);
        }

        // --- CACHE TILE DI SISI SERVER ---
        //
        // Filter `cabang` di GeoServer butuh 10-30 detik per tile karena
        // kolomnya tidak terindeks. Berpindah filter bolak-balik (A -> B -> A)
        // adalah pola pemakaian yang wajar, dan tanpa cache setiap perpindahan
        // membayar ulang biaya itu penuh.
        //
        // Hanya GETMAP/GETLEGENDGRAPHIC yang di-cache: tile bersifat tetap
        // untuk kombinasi layer+bbox+filter yang sama. GetFeature tidak
        // di-cache karena data atribut bisa berubah.
        $bolehCache = in_array($operation, ['GETMAP', 'GETLEGENDGRAPHIC'], true);
        $kunciCache = null;
        $berkasCache = null;

        if ($bolehCache) {
            $kunciCache = md5($targetUrl.http_build_query($params));
            $berkasCache = $this->pathCache($kunciCache);

            if (is_file($berkasCache) && (time() - filemtime($berkasCache)) < self::UMUR_CACHE) {
                $isi = @file_get_contents($berkasCache);
                if ($isi !== false && $isi !== '') {
                    return response($isi, 200)
                        ->header('Content-Type', 'image/png')
                        ->header('X-Content-Type-Options', 'nosniff')
                        ->header('Cache-Control', 'public, max-age=86400, immutable')
                        ->header('ETag', '"'.$kunciCache.'"')
                        ->header('X-Tile-Cache', 'HIT');
                }
            }
        }
        // --- AKHIR CACHE TILE ---

        try {
            $response = Http::timeout(60)
                ->connectTimeout(10)
                ->retry(2, 200, throw: false)
                ->withOptions(['verify' => config('gis.geoserver_verify_tls', true)])
                ->get($targetUrl, $params);
        } catch (\Throwable $e) {
            // detail hanya ke log, bukan ke klien
            Log::error('GeoServer proxy exception', [
                'operation' => $operation,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Proxy gagal memproses permintaan'], 502);
        }

        if ($response->successful()) {
            $contentType = $response->header('Content-Type');
            $cacheable = in_array($operation, ['GETMAP', 'GETLEGENDGRAPHIC'], true);

            // ETag dari kombinasi URL target + parameter yang sudah difilter:
            // permintaan identik menghasilkan ETag sama, sehingga browser bisa
            // memakai cache lokal tanpa round-trip ke GeoServer.
            $etag = '"'.md5($targetUrl.http_build_query($params)).'"';

            // Klien yang masih punya tile ini boleh langsung pakai cache.
            if ($cacheable && trim((string) $request->header('If-None-Match')) === $etag) {
                return response('', 304)
                    ->header('ETag', $etag)
                    ->header('Cache-Control', 'public, max-age=86400');
            }

            // Simpan tile ke cache disk supaya permintaan berikutnya untuk
            // kombinasi layer+bbox+filter yang sama tidak menyentuh
            // GeoServer lagi. Inilah yang membuat perpindahan filter
            // bolak-balik (A -> B -> A) menjadi instan.
            if ($bolehCache && $berkasCache) {
                $isiTile = $response->body();
                // hanya simpan tile berukuran wajar (lihat MAKS_UKURAN_TILE_CACHE)
                if ($isiTile !== '' && strlen($isiTile) <= self::MAKS_UKURAN_TILE_CACHE) {
                    $folder = dirname($berkasCache);
                    if (! is_dir($folder)) {
                        @mkdir($folder, 0775, true);
                    }
                    if (@file_put_contents($berkasCache, $isiTile) !== false) {
                        @touch($berkasCache);
                        // bersihkan berkas lama sesekali (1 dari 50 simpanan)
                        if (random_int(1, 50) === 1) {
                            $this->rapikanCache();
                        }
                    }
                }
            }

            return response($response->body(), 200)
                ->header('Content-Type', $contentType ?: 'image/png')
                ->header('X-Content-Type-Options', 'nosniff')
                // Tile WMS bersifat immutable per kombinasi bbox+layer+filter:
                // simpan sehari, bukan 5 menit. Tanpa ini, pan balik ke area
                // yang sudah dilihat tetap memicu request baru ke GeoServer.
                ->header('Cache-Control', $cacheable ? 'public, max-age=86400, immutable' : 'no-store')
                ->header('ETag', $etag)
                ->header('X-Tile-Cache', $bolehCache ? 'MISS' : 'OFF');
        }
        Log::error('GeoServer proxy error', [
            'operation' => $operation,
            'status' => $response->status(),
        ]);

        return response()->json(['error' => 'GeoServer menolak permintaan'], 502);
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    private function filterParams(array $query): array
    {
        $allowed = array_flip(self::ALLOWED_PARAMS);
        $clean = [];

        foreach ($query as $key => $value) {
            if (! isset($allowed[strtolower((string) $key)]) || ! is_scalar($value)) {
                continue;
            }
            $clean[strtolower((string) $key)] = (string) $value;
        }

        return $clean;
    }

    /**
     * Validasi ringan CQL sebelum diteruskan.
     *
     * Bukan parser penuh: tujuannya menolak input yang jelas berbahaya
     * (kutip tidak seimbang, komentar SQL, statement berantai) tanpa
     * merusak ekspresi CQL yang sah seperti LIKE '%nama%'.
     */
    private function cqlLooksSafe(string $cql): bool
    {
        // kutip tunggal harus genap
        if (substr_count($cql, "'") % 2 !== 0) {
            return false;
        }

        // tidak boleh ada komentar / pemisah statement
        foreach (['--', '/*', '*/', ';', '\\'] as $bad) {
            if (str_contains($cql, $bad)) {
                return false;
            }
        }

        // hanya karakter yang muncul pada ekspresi CQL normal
        // ':' WAJIB ada: filter klik memakai BBOX(geom,...,'EPSG:4326')
        // untuk menggabungkan batas area dengan filter layer (GeoServer
        // menolak bbox + cql_filter sekaligus). Tanpa ':' semua query klik
        // yang berfilter ditolak 400 "cql_filter tidak valid".
        return (bool) preg_match('/^[A-Za-z0-9_%.,()\'\s<>=!+*\/:-]+$/u', $cql);
    }

    /**
     * Batasi jumlah fitur dan kolom yang dikembalikan.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    private function limitWfs(array $params): array
    {
        // Hanya geometri? Batasnya lebih longgar (lihat MAX_FEATURES_GEOM_ONLY).
        // Dicek dari propertyname karena hanya kolom geom yang dikirim.
        $hanyaGeom = false;
        if (isset($params['propertyname'])) {
            $kolomDiminta = array_filter(array_map('trim', explode(',', (string) $params['propertyname'])));
            $hanyaGeom = count($kolomDiminta) > 0
                && count(array_diff($kolomDiminta, ['geom'])) === 0;
        }

        $maks = $hanyaGeom ? self::MAX_FEATURES_GEOM_ONLY : self::MAX_FEATURES;

        // Klien boleh meminta lewat 'count' (WFS 2.0) ATAU 'maxfeatures' (WFS 1.x).
        // Sebelumnya hanya 'maxfeatures' yang dibaca, sehingga client yang
        // mengirim count=300 tetap dipotong ke 50 — sampel extent terlalu
        // sedikit dan kotak pembatasnya meleset.
        $diminta = $params['count'] ?? $params['maxfeatures'] ?? $maks;
        $batas = max(1, min((int) $diminta, $maks));

        // WFS 1.x memakai maxfeatures; WFS 2.0 memakai count.
        // Sebelumnya hanya maxfeatures yang dikirim, sehingga permintaan
        // WFS 2.0 dari klien (yang mengirim maxfeatures juga) tetap
        // mengembalikan SELURUH 65.694 fitur — 22 MB per klik popup.
        // Kirim keduanya; GeoServer mengabaikan yang tidak relevan.
        $params['maxfeatures'] = $batas;
        $params['count'] = $batas;

        // klien hanya boleh minta format data yang aman (cegah JSONP/script injection)
        if (isset($params['outputformat'])) {
            $allowedFormats = ['application/json', 'application/json;charset=utf-8', 'gml2', 'gml3'];
            if (! in_array(strtolower($params['outputformat']), $allowedFormats, true)) {
                $params['outputformat'] = 'application/json';
            }
        }

        // Daftar kolom mengikuti layer yang diminta. Layer tanpa entri khusus
        // memakai daftar bawaan (kolom pelanggan).
        $typename = strtolower((string) ($params['typename'] ?? ''));
        $namaLayer = str_contains($typename, ':') ? explode(':', $typename, 2)[1] : $typename;

        // Layer yang TIDAK punya entri khusus: jangan kirim propertyname sama
        // sekali. Dulu daftar kolom pelanggan dipaksa ke semua layer sehingga
        // GetFeature untuk layer aksesoris ditolak GeoServer.
        //
        // KECUALI permintaan geometri-saja: geom selalu ada di semua layer,
        // jadi propertyname=geom aman dan wajib diteruskan — tanpa itu
        // autoZoom tidak mendapat geometri untuk layer aksesoris.
        if (!isset(self::WFS_PROPERTIES_PER_LAYER[$namaLayer]) && $namaLayer !== 'analisa_pelanggan') {
            if ($hanyaGeom) {
                $params['propertyname'] = 'geom';
            } else {
                unset($params['propertyname']);
            }

            return $params;
        }

        // Permintaan GEOMETRI SAJA harus dihormati apa adanya.
        //
        // autoZoom.js meminta `propertyName=geom` untuk menghitung kotak
        // pembatas hasil filter. Blok di bawah dulu SELALU menambahkan
        // seluruh kolom layer, sehingga permintaan ringan itu berubah jadi
        // permintaan penuh — mahal, dan batas 1500 fitur geom-only tidak
        // pernah terpakai.
        if ($hanyaGeom) {
            $params['propertyname'] = 'geom';

            return $params;
        }

        $daftar = self::WFS_PROPERTIES_PER_LAYER[$namaLayer] ?? self::WFS_PROPERTIES;

        // Klien boleh minta subset, tapi tidak boleh minta kolom di luar whitelist.
        // 'geom' WAJIB disertakan: tanpa itu GeoServer mengirim geometry: null
        // dan pencarian tidak bisa menaruh marker di peta.
        $wajib = in_array('geom', $daftar, true) ? ['geom'] : ['nama', 'nolang', 'geom'];

        if (isset($params['propertyname'])) {
            $diminta = array_map('trim', explode(',', $params['propertyname']));
            $diizinkan = array_values(array_intersect($diminta, $daftar));
            $kolom = $diizinkan ?: $daftar;
        } else {
            $kolom = $daftar;
        }

        $kolom = array_values(array_unique(array_merge($kolom, $wajib)));
        $params['propertyname'] = implode(',', $kolom);

        return $params;
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function dimensionsAllowed(array $params): bool
    {
        foreach (['width', 'height'] as $key) {
            if (isset($params[$key]) && (int) $params[$key] > self::MAX_DIMENSION) {
                return false;
            }
        }

        return true;
    }
}
