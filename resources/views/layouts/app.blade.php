<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{{ $title ?? 'WebGIS Tirta Perwira' }}</title>

    {{-- PWA --}}
    <link rel="manifest" href="{{ route('manifest') }}">
    <meta name="theme-color" content="#1d4ed8">
    {{-- viewport-fit=cover + warna ini membuat header menyambung ke status bar
         (tidak ada "batas" putih di atas aplikasi). --}}
    <meta name="application-name" content="WebGIS Tirta Perwira">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    {{-- iOS: mode standalone & status bar --}}
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="WebGIS PDAM">


    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;801&display=swap" rel="stylesheet">

    <!-- CSS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    @vite(['resources/css/app.css'])

    {{-- Entry JS: peta (app.js) atau admin (admin.js). Halaman admin tidak
         memuat app.js supaya modul tidak dieksekusi dua kali dan tidak
         menanggung bundle peta. --}}
    @hasSection('admin-assets')
        @yield('admin-assets')
    @else
        @vite(['resources/js/app.js'])
    @endif

    @stack('styles')
</head>
<body class="bg-slate-50 h-screen overflow-hidden flex flex-col antialiased text-slate-900" style="font-family: 'Plus Jakarta Sans', sans-serif;">
    <!-- Sidebar Backdrop (Mobile only) -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <header class="bg-glass-blue border-b border-blue-400/30 h-16 flex items-center justify-between px-6 z-50 sticky top-0 shadow-premium">
        <!-- Logo & Toggle -->
        <div class="flex items-center gap-4">
            <button id="sidebarToggle" aria-label="Buka menu navigasi" aria-controls="sidebar" class="hidden p-2.5 rounded-2xl text-white bg-white/10 hover:bg-white hover:text-blue-600 transition-all border border-white/20 shadow-sm shadow-blue-500/10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            <div class="flex items-center gap-3 group">
                <div class="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <img src="https://cdn-icons-png.flaticon.com/512/7471/7471547.png" alt="Logo" class="w-7 h-7">
                </div>
                <div class="header-brand hidden lg:block border-l border-white/20 pl-4">
                    <h1 class="font-black text-xl tracking-tighter leading-none text-white uppercase">WEB<span class="text-blue-200">GIS</span></h1>
                    <p class="text-[8px] uppercase font-black tracking-[0.2em] text-blue-100 leading-none mt-1">Tirta Perwira</p>
                </div>
            </div>
        </div>
        
        <!-- Actions (Search & Profile) -->
        <div class="flex items-center justify-end gap-2 md:gap-4 ml-auto flex-1 max-w-4xl">
            <!-- Desktop Search -->
            <div class="flex-1 max-w-xl hidden md:block">
                <div class="relative group">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <input type="text" id="customerSearchInput" placeholder="Cari Pelanggan atau Nomor Langganan..." aria-autocomplete="list" aria-controls="desktopSuggest" class="w-full bg-slate-100/50 border border-transparent text-slate-700 text-xs font-bold rounded-2xl pl-11 pr-32 py-3.5 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm border-slate-200/60 transition-all duration-300">
                    <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                        <button type="button" id="desktopRefreshMap" data-peta-refresh
                                aria-label="Muat ulang peta" title="Muat ulang peta"
                                class="header-refresh p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 005.64 5.64L4 10m0 4a9 9 0 0014.36 3.36L20 14"></path>
                            </svg>
                        </button>
                        <button id="clearSearch" aria-label="Bersihkan pencarian" class="p-2 text-slate-300 hover:text-red-500 hidden transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        <button id="searchButton" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20">Cari</button>
                    </div>
                    <div class="fsug fsug--desktop" id="desktopSuggest" data-open="0" role="listbox" aria-label="Saran pelanggan"></div>
                </div>
            </div>
            
            <!-- Mobile: refresh peta + ikon cari + akun di header -->
            <button type="button" id="mobileRefreshMap" data-peta-refresh
                    aria-label="Muat ulang peta" title="Muat ulang peta"
                    class="md:hidden header-refresh header-refresh--mobile p-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 005.64 5.64L4 10m0 4a9 9 0 0014.36 3.36L20 14"></path>
                </svg>
            </button>
            <button id="mobileSearchToggle" aria-label="Buka pencarian" aria-controls="mobileHeaderSearch" aria-expanded="false" class="md:hidden p-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </button>
            @auth
            <button id="mobileAkunToggle" aria-label="Buka menu akun" aria-haspopup="true" aria-expanded="false" class="md:hidden p-1 text-white/90 hover:text-white transition-all">
                <span class="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white text-xs font-black">
                    {{ strtoupper(substr(Auth::user()->username, 0, 1)) }}
                </span>
            </button>
            @endauth

            <!-- Profile Dropdown (desktop) — di mobile sudah ada tab Akun -->
            @auth
            <div class="relative items-center gap-3 border-l border-white/20 pl-5 ml-1 hidden md:flex" id="profileContainer">
                <div class="text-right hidden sm:block">
                    <p class="text-[10px] font-black text-white uppercase leading-none tracking-tight">{{ Auth::user()->username }}</p>
                    <p class="text-[8px] text-blue-200 font-black uppercase tracking-[0.1em] mt-0.5">Admin Server</p>
                </div>
                <button id="profileToggle" class="relative group cursor-pointer focus:outline-none">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-all">
                        {{ strtoupper(substr(Auth::user()->username, 0, 1)) }}
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </button>
            </div>
            @endauth
        </div>
    </header>

    @auth
    {{-- Dropdown profil dipakai desktop (dropdown) dan mobile (bottom sheet) --}}
<div id="profileDropdown" class="hidden md:absolute md:top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform origin-top-right transition-all duration-200 z-[100] opacity-0 scale-95">
                    <div class="p-4 bg-slate-50 border-b border-slate-100">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Akun Terhubung</p>
                        <p class="text-xs font-black text-slate-800 truncate">{{ Auth::user()->username }}</p>
                    </div>
                    <div class="p-2">
                        <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <span class="text-[11px] font-bold uppercase tracking-wide">Profil Saya</span>
                        </a>
                        <a href="{{ route('logout') }}" class="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group text-left">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                            </div>
                            <span class="text-[11px] font-bold uppercase tracking-wide">Keluar Sistem</span>
                        </a>
                    </div>
                </div>
    @endauth

    <!-- Mobile Header Search: panel meluncur di bawah header, bukan di atas peta.
         Default tertutup; dibuka dari ikon cari di header atau tab Cari. -->
    <div id="mobileHeaderSearch" class="mobile-header-search md:hidden" data-open="0" aria-hidden="true">
        <form class="mobile-header-search__form" id="mobileHeaderSearchForm" role="search">
            <div class="mobile-header-search__field">
                <svg width="18" height="18" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" stroke-width="2.5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="search" id="mobileFloatSearch" placeholder="Nama atau no. langganan"
                       autocomplete="off" enterkeyhint="search" inputmode="search"
                       aria-label="Cari pelanggan" aria-autocomplete="list" aria-controls="mobileSuggest">
                <button type="button" class="mobile-header-search__clear" id="mobileHeaderSearchClear"
                        aria-label="Bersihkan pencarian">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <button type="submit" class="mobile-header-search__btn" id="mobileFloatSearchBtn">Cari</button>
        </form>
        <div class="fsug" id="mobileSuggest" data-open="0" role="listbox" aria-label="Saran pelanggan"></div>
    </div>

    <div class="flex-1 flex overflow-hidden min-h-0 relative">
        @include('partials.sidebar')
        <main class="flex-1 flex flex-col relative bg-slate-200 shadow-inner overflow-hidden">
            @yield('content')
        </main>
    </div>

    @if(!empty($mobileShell ?? false))
        @include('partials.mobile-shell')
    @endif

    <footer class="bg-blue-900 border-t border-blue-800 p-3 text-center text-[10px] font-bold tracking-widest z-50">
        <p class="text-blue-300/60">
            <span class="hidden sm:inline">Copyright © 2021 </span>
            <span class="text-white">Tirta Perwira</span>
            <span class="hidden sm:inline"> Versi 4.0 | Departement IT dan Tim GIS</span>
            <span class="sm:hidden font-black ml-1 text-white">V4.0</span>
        </p>
    </footer>




    @stack('scripts')
</body>
</html>
