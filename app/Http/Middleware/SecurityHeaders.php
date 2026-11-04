<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // camera=(self) DIBUTUHKAN modul Camera AR. Sebelumnya camera=()
        // memblokir getUserMedia sepenuhnya: tombol AR membuka panel tetapi
        // stream kamera selalu ditolak dengan
        // "Permissions policy violation: camera is not allowed".
        $response->headers->set('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
        $response->headers->set('Content-Security-Policy', $this->csp());

        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }

    /**
     * CSP ketat. Sumber daya yang diizinkan:
     *  - self (bundle Vite, /geo-proxy)
     *  - cdnjs (Leaflet + jQuery, belum di-bundle)
     *  - Google Fonts
     *  - tile OSM + Google + ikon flaticon
     *
     * 'unsafe-inline' pada style dibutuhkan Tailwind arbitrer inline
     * dan atribut style Leaflet; script TIDAK mengizinkannya.
     */
    private function csp(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://mt0.google.com https://mt1.google.com https://mt2.google.com https://mt3.google.com https://*.googleapis.com https://cdn-icons-png.flaticon.com",
            // sourcemap Leaflet/leaflet.js.map diambil DevTools sebagai fetch,
            // jadi host CDN perlu ada di connect-src juga (img-src saja tidak cukup).
            "connect-src 'self' https://cdnjs.cloudflare.com",
            // Camera AR memutar stream kamera sebagai blob: URL.
            "media-src 'self' blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
    }
}
