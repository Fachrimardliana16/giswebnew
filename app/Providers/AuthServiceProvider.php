<?php

namespace App\Providers;

use App\Auth\PgsqlUserProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Auth::provider('pgsql', function ($app, array $config) {
            return new PgsqlUserProvider;
        });
    }
}
