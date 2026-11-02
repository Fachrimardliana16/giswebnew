<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
        'maxfeatures', 'propertyname', 'exceptions', 'bgcolor',
    ];

    /** Kolom yang boleh dikirim ke browser untuk GetFeature. */
    private const WFS_PROPERTIES = [
        'nama', 'nolang', 'rayon', 'alamat', 'tarif', 'status', 'cabang',
        'drd_pemakaian', 'tungg_lembar', 'tungg_rptagihan', 'tungg_cicilan',
        'tgllunas', 'bacameter_tglbaca', 'bacameter_namacater', 'isvalid',
        'debit', 'umurwm_tahun', 'wm_noseri', 'wm_merk', 'wm_tglgantimeter',
    ];

    private const MAX_FEATURES = 50;

    private const MAX_DIMENSION = 4096;

    private const MAX_CQL_LENGTH = 1000;

    /**
     * Proxy request ke GeoServer untuk menghindari Mixed Content.
     */
    public function proxy(Request $request)
    {
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

            return response($response->body(), 200)
                ->header('Content-Type', $contentType ?: 'image/png')
                ->header('X-Content-Type-Options', 'nosniff')
                ->header('Cache-Control', $cacheable ? 'public, max-age=300' : 'no-store');
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
        return (bool) preg_match('/^[A-Za-z0-9_%.,()\'\s<>=!+*\/-]+$/u', $cql);
    }

    /**
     * Batasi jumlah fitur dan kolom yang dikembalikan.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     */
    private function limitWfs(array $params): array
    {
        $requested = (int) ($params['maxfeatures'] ?? self::MAX_FEATURES);
        $params['maxfeatures'] = max(1, min($requested, self::MAX_FEATURES));

        // klien hanya boleh minta format data yang aman (cegah JSONP/script injection)
        if (isset($params['outputformat'])) {
            $allowedFormats = ['application/json', 'application/json;charset=utf-8', 'gml2', 'gml3'];
            if (! in_array(strtolower($params['outputformat']), $allowedFormats, true)) {
                $params['outputformat'] = 'application/json';
            }
        }

        // Klien boleh minta subset, tapi tidak boleh minta kolom di luar whitelist.
        // 'geom' WAJIB disertakan: tanpa itu GeoServer mengirim geometry: null
        // dan pencarian tidak bisa menaruh marker di peta.
        $wajib = ['nama', 'nolang', 'geom'];

        if (isset($params['propertyname'])) {
            $diminta = array_map('trim', explode(',', $params['propertyname']));
            $diizinkan = array_values(array_intersect($diminta, self::WFS_PROPERTIES));
            $kolom = $diizinkan ?: self::WFS_PROPERTIES;
        } else {
            $kolom = self::WFS_PROPERTIES;
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
