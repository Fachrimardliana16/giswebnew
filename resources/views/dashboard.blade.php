@extends('layouts.app')

@push('styles')
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
@endpush

@php($mobileShell = true)   {{-- aktifkan bottom nav + FAB di layout --}}

@section('content')
    <div class="flex-1 relative overflow-hidden group">
        <div id="map" class="absolute inset-0"></div>

        {{-- Search melayang (mobile): menggantikan search bar header --}}
        <div class="mobile-search-float">
            <div class="mobile-search-float__field">
                <svg width="18" height="18" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="search" id="mobileFloatSearch" placeholder="Cari nama / no. langganan"
                       autocomplete="off" enterkeyhint="search" inputmode="search"
                       aria-label="Cari pelanggan">
                <button type="button" class="mobile-search-float__btn" id="mobileFloatSearchBtn">Cari</button>
            </div>
        </div>

        {{-- Kontrol peta desktop. Tombol basemap dipindah ke sheet "Tampilan Peta"
             (dibuka dari FAB di mobile / tombol di desktop). --}}
        <div class="absolute top-6 right-6 z-30 hidden md:flex flex-col gap-3">
            <button type="button" data-basemap-fab-desktop aria-label="Pilih tampilan peta" class="flex items-center gap-3 px-4 py-3 bg-glass border border-white/30 rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all group overflow-hidden">
                <div class="w-9 h-9 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white shadow-inner">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0021 17.882V8.118a2 2 0 00-1.447-1.894L15 4m0 13V4m0 0L9 1"></path>
                    </svg>
                </div>
                <div class="flex flex-col items-start">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tampilan</span>
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight">Peta</span>
                </div>
            </button>
            <button id="getLocationBtn" aria-label="Tampilkan lokasi saya" class="flex items-center gap-3 px-4 py-3 bg-glass border border-white/30 rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all group overflow-hidden">
                <div class="w-9 h-9 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-600 transition-all group-hover:bg-emerald-600 group-hover:text-white shadow-inner" id="locationIcon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </div>
                <div class="flex flex-col items-start">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lokasi</span>
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight">Saya Sekarang</span>
                </div>
            </button>
        </div>

        {{-- State + tombol basemap tersembunyi: dipakai bersama oleh FAB mobile
             dan sheet "Tampilan Peta". Tidak terlihat, hanya pemicu logika. --}}
        <button id="baseMapToggle" type="button" class="sr-only" aria-hidden="true" tabindex="-1"></button>
        <span id="baseMapLabel" class="sr-only">Satelit</span>
        <span id="baseMapIcon" class="hidden"></span>

        <!-- Loading indicator -->
        <div id="loadingIndicator" class="hidden absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[1000] transition-all duration-300">
            <div class="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-premium flex flex-col items-center gap-4 border border-white/20">
                <div class="water-loader shadow-lg shadow-blue-500/20"></div>
                <div class="flex flex-col items-center gap-1.5">
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">dela, lur. loading sit..</span>
                    <span id="zoomHint" class="hidden text-[9px] font-bold text-blue-600 uppercase tracking-tighter">zoom maning lur. ben ora kadohen.</span>
                </div>
            </div>
        </div>
    </div>
@endsection

