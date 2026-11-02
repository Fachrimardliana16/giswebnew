<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'admin.access' => \App\Http\Middleware\AdminAccessMiddleware::class,
        ]);

        // Percayai proxy hanya di lingkungan yang memang di belakang proxy
        // (Cloudflare/nginx). Tanpa ini, rate limiter login memakai IP proxy
        // sehingga satu penyerang bisa mengunci semua user.
        $middleware->trustProxies(
            at: env('TRUSTED_PROXIES', '127.0.0.1,::1'),
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST
                | \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT,
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
