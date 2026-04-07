<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required'],
            'password' => ['required'],
        ]);

        $throttleKey = strtolower($request->input('username')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'error' => "Terlalu banyak percobaan login. Silakan coba lagi dalam $seconds detik.",
            ])->onlyInput('username');
        }

        if (Auth::guard('web')->attempt($credentials)) {
            RateLimiter::clear($throttleKey);
            $request->session()->regenerate();
            return redirect()->intended('/dashboard');
        }

        RateLimiter::hit($throttleKey);

        return back()->withErrors([
            'error' => 'Login gagal: Periksa kembali username dan password Anda.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }
}
