<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');

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
