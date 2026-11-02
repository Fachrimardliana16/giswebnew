<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    /** Maksimum percobaan per kombinasi username+IP. */
    private const MAX_PER_CREDENTIAL = 5;

    /** Maksimum percobaan per IP (menahan penyebaran ke banyak username). */
    private const MAX_PER_IP = 30;

    private const DECAY_SECONDS = 60;

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
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['nullable'],
        ]);

        $ip = $request->ip();
        $credentialKey = 'login:cred:'.mb_strtolower($credentials['username']).'|'.$ip;
        $ipKey = 'login:ip:'.$ip;

        if (RateLimiter::tooManyAttempts($credentialKey, self::MAX_PER_CREDENTIAL)) {
            return $this->throttled($credentialKey, $request);
        }

        if (RateLimiter::tooManyAttempts($ipKey, self::MAX_PER_IP)) {
            return $this->throttled($ipKey, $request);
        }

        $attempt = Auth::guard('web')->attempt(
            ['username' => $credentials['username'], 'password' => $credentials['password']],
            $request->boolean('remember'),
        );

        if ($attempt) {
            RateLimiter::clear($credentialKey);
            RateLimiter::clear($ipKey);
            $request->session()->regenerate();

            return redirect()->intended('/dashboard');
        }

        RateLimiter::hit($credentialKey, self::DECAY_SECONDS);
        RateLimiter::hit($ipKey, self::DECAY_SECONDS);

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

    private function throttled(string $key, Request $request)
    {
        $seconds = RateLimiter::availableIn($key);

        return back()->withErrors([
            'error' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
        ])->onlyInput('username');
    }
}
