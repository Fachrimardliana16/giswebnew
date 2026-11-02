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
        $response->headers->set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
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
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://mt1.google.com https://cdn-icons-png.flaticon.com",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
    }
}
