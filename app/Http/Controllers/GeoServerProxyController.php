<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeoServerProxyController extends Controller
{
    /**
     * Proxy request to GeoServer to avoid Mixed Content errors.
     */
    public function proxy(Request $request)
    {
        // Get the backend URL from .env or config
        $baseUrl = config('gis.geoserver_url', env('GIS_GEOSERVER_URL'));
        $wfsUrl = config('gis.geoserver_wfs_url', env('VITE_GEOSERVER_WFS_URL'));

        // Determine if this is a WFS or WMS call
        $isWfs = $request->has('service') && strtoupper($request->query('service')) === 'WFS';
        $targetUrl = $isWfs ? $wfsUrl : $baseUrl;

        if (!$targetUrl) {
            return response()->json(['error' => 'GeoServer URL not configured'], 500);
        }

        try {
            // Forward everything: query params, headers (optional), etc.
            $response = Http::withOptions(['verify' => false])
                ->timeout(60)
                ->get($targetUrl, $request->query());

            if ($response->successful()) {
                $contentType = $response->header('Content-Type');
                return response($response->body(), 200)
                    ->header('Content-Type', $contentType ?: 'image/png');
            }

            Log::error('GeoServer Proxy Error: ' . $response->status(), [
                'url' => $targetUrl,
                'params' => $request->query(),
                'body' => $response->body()
            ]);

            return response($response->body(), $response->status());

        } catch (\Exception $e) {
            Log::error('GeoServer Proxy Exception: ' . $e->getMessage());
            return response()->json(['error' => 'Proxy Fail: ' . $e->getMessage()], 500);
        }
    }
}
