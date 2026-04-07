<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Auth;
use App\Auth\PgsqlUserProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Auth::provider('pgsql', function ($app, array $config) {
            return new PgsqlUserProvider();
        });
    }
}
