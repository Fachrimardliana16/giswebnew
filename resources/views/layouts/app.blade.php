<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'WebGIS Tirta Perwira' }}</title>
    
    <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/7471/7471547.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;801&display=swap" rel="stylesheet">

    <!-- CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <!-- Leaflet JS (In Head for proper order) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
    
    @stack('styles')
</head>
<body class="bg-slate-50 min-h-screen flex flex-col antialiased text-slate-900" style="font-family: 'Plus Jakarta Sans', sans-serif;">
    <!-- Sidebar Backdrop (Mobile only) -->
    <div id="sidebarBackdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden transition-opacity duration-300"></div>

    <header class="bg-glass border-b border-white/20 h-16 flex items-center justify-between px-6 z-50 sticky top-0 shadow-premium">
        <!-- Logo & Toggle -->
        <div class="flex items-center gap-4">
            <button id="sidebarToggle" class="p-2.5 rounded-2xl text-blue-600 bg-blue-50/50 md:hidden hover:bg-blue-600 hover:text-white transition-all border border-blue-100/50 shadow-sm shadow-blue-500/10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            <div class="flex items-center gap-3 group">
                <div class="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <img src="https://cdn-icons-png.flaticon.com/512/7471/7471547.png" alt="Logo" class="w-7 h-7">
                </div>
                <div class="hidden lg:block border-l border-slate-200 pl-4">
                    <h1 class="font-black text-xl tracking-tighter leading-none text-slate-800 uppercase">WEB<span class="text-blue-600">GIS</span></h1>
                    <p class="text-[8px] uppercase font-black tracking-[0.2em] text-slate-400 leading-none mt-1">Tirta Perwira</p>
                </div>
            </div>
        </div>
        
        <!-- Search -->
        <div class="flex-1 max-w-2xl mx-10 hidden md:block">
            <div class="relative group">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg class="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <input type="text" id="customerSearchInput" placeholder="Cari Nama Pelanggan atau Nomor Langganan..." class="w-full bg-slate-100/50 border border-transparent text-slate-700 text-xs font-bold rounded-2xl pl-11 pr-32 py-3.5 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm border-slate-200/60 transition-all duration-300">
                <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                    <button id="clearSearch" class="p-2 text-slate-300 hover:text-red-500 hidden transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <button id="searchButton" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20">Cari</button>
                </div>
            </div>
        </div>
        
        <!-- Profile -->
        <div class="flex items-center gap-4">
            <button class="md:hidden p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </button>
        </div>

        <!-- Profile Dropdown -->
        @auth
        <div class="relative items-center gap-3 border-l border-slate-200 pl-5 ml-1 hidden sm:flex" id="profileContainer">
            <div class="text-right">
                <p class="text-[10px] font-black text-slate-800 uppercase leading-none tracking-tight">{{ Auth::user()->username }}</p>
                <p class="text-[8px] text-blue-600 font-black uppercase tracking-[0.1em] mt-0.5">Admin Server</p>
            </div>
            <button id="profileToggle" class="relative group cursor-pointer focus:outline-none">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-all">
                    {{ strtoupper(substr(Auth::user()->username, 0, 1)) }}
                </div>
                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </button>

            <!-- Dropdown Menu -->
            <div id="profileDropdown" class="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden hidden transform origin-top-right transition-all duration-200 z-[100] opacity-0 scale-95">
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
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group text-left">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                            </div>
                            <span class="text-[11px] font-bold uppercase tracking-wide">Keluar Sistem</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
        @endauth
    </header>

    <div class="flex-1 flex overflow-hidden min-h-0 relative">
        @include('partials.sidebar')
        <main class="flex-1 flex flex-col relative bg-slate-200 shadow-inner overflow-hidden">
            @yield('content')
        </main>
    </div>

    <footer class="bg-white border-t border-slate-200 p-2 text-center text-[10px] font-bold tracking-widest z-50">
        <p class="text-slate-400">
            <span class="hidden sm:inline">Copyright © 2021 </span>
            <span class="text-blue-600">Tirta Perwira</span>
            <span class="hidden sm:inline"> Versi 4.0 | Departement IT dan Tim GIS</span>
            <span class="sm:hidden font-black ml-1">V4.0</span>
        </p>
    </footer>




    @stack('scripts')
</body>
</html>
