<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\GeoServerProxyController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');

// Service worker: no-cache wajib, kalau tidak versi baru tidak akan terpakai.
// Lihat komentar di dalam closure.
Route::get('/sw.js', function () {
    // File berada di resources/sw, BUKAN public/, supaya web server tidak
    // menyajikannya sebagai file statis tanpa header no-cache.
    $path = resource_path('sw/sw.js');

    if (! file_exists($path)) {
        abort(404);
    }

    return response(file_get_contents($path), 200, [
        'Content-Type' => 'application/javascript; charset=utf-8',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Service-Worker-Allowed' => '/',
    ]);
})->name('service-worker');

// Manifest PWA juga tidak perlu di-cache lama.
Route::get('/manifest.webmanifest', function () {
    $path = public_path('manifest.webmanifest');

    if (! file_exists($path)) {
        abort(404);
    }

    return response(file_get_contents($path), 200, [
        'Content-Type' => 'application/manifest+json; charset=utf-8',
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->name('manifest');

// --- AUDIT KEAMANAN: route debug dihapus -------------------------------
//
// 1. /test-geoserver  -> duplikat /geo-proxy tanpa auth, tidak dipakai UI.
//                        Dihapus.
// 2. /geo-proxy        -> sebelumnya TANPA auth: siapa pun di internet bisa
//                        memakai server ini sebagai proxy GeoServer gratis
//                        (open proxy), menghabiskan kuota dan membebani
//                        upstream. Sekarang wajib login.
//                        Endpoint tetap di luar grup auth supaya tile yang
//                        di-cache SW tidak memicu redirect ke /login, tetapi
//                        aksesnya diperiksa di controller.
// 3. /login-test       -> mem-bypass CSRF (withoutMiddleware('web')) dan
//                        menanamkan password plaintext di kode. Dihapus;
//                        login normal sudah cukup.
//
Route::get('/geo-proxy', [GeoServerProxyController::class, 'proxy'])->name('geo.proxy');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [MapController::class, 'index'])->name('dashboard');
    
    // User & Role Management (Admin only)
    Route::middleware(['admin.access'])->group(function () {
        Route::get('/settings/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/settings/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/settings/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/settings/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/settings/users/bulk-delete', [UserController::class, 'bulkDestroy'])->name('users.bulkDestroy');

        Route::get('/settings/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/settings/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::put('/settings/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/settings/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::post('/settings/roles/bulk-delete', [RoleController::class, 'bulkDestroy'])->name('roles.bulkDestroy');
    });
});
