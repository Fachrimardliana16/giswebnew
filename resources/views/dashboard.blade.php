@extends('layouts.app')

@section('content')
    <div class="flex-1 relative overflow-hidden group">
        <div id="map" class="absolute inset-0"></div>
        
        <!-- Custom Map Controls -->
        <div class="absolute top-20 md:top-6 right-4 md:right-6 z-30 flex flex-col gap-3">
            <!-- Base Map Toggle -->
            <button id="baseMapToggle" class="flex items-center md:gap-3 p-2.5 md:px-4 md:py-3 bg-glass border border-white/30 rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all group overflow-hidden">
                <div class="w-9 h-9 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white shadow-inner" id="baseMapIcon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="hidden md:flex flex-col items-start">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Visualisasi</span>
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight" id="baseMapLabel">Satelit</span>
                </div>
            </button>

            <!-- Get My Location Button -->
            <button id="getLocationBtn" class="flex items-center md:gap-3 p-2.5 md:px-4 md:py-3 bg-glass border border-white/30 rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all group overflow-hidden">
                <div class="w-9 h-9 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-600 transition-all group-hover:bg-emerald-600 group-hover:text-white shadow-inner" id="locationIcon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                </div>
                <div class="hidden md:flex flex-col items-start">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lokasi</span>
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight">Saya Sekarang</span>
                </div>
            </button>
        </div>
        
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

@push('scripts')
<script>
    let loadingWatchdog = null;

    const resetLoading = () => {
        window.loadingLayersCount = 0;
        $('#loadingIndicator').addClass('hidden').removeClass('flex');
        $('#zoomHint').addClass('hidden');
        if (loadingWatchdog) clearTimeout(loadingWatchdog);
    };

    const startWatchdog = () => {
        if (loadingWatchdog) clearTimeout(loadingWatchdog);
        loadingWatchdog = setTimeout(() => {
            if (window.loadingLayersCount > 0) {
                console.warn('Loading taking too long, forcing reset...');
                resetLoading();
                if (window.showToast) {
                    window.showToast('Beberapa data memerlukan Zoom lebih dalam untuk tampil.', 'warning', 5000);
                }
            }
        }, 8000); // 8 second timeout
    };

    window.startLoadingWatchdog = startWatchdog;
    window.stopLoadingWatchdog = () => { if (loadingWatchdog) clearTimeout(loadingWatchdog); };

    $(document).ajaxStart(function() {
        if (typeof window.loadingLayersCount === 'undefined') window.loadingLayersCount = 0;
        window.loadingLayersCount++;
        $('#loadingIndicator').removeClass('hidden').addClass('flex');
        
        // Show zoom hint if zoom is low
        if (window.map && window.map.getZoom() < 12) {
            $('#zoomHint').removeClass('hidden');
        }
        
        startWatchdog();
    }).ajaxStop(function() {
        window.loadingLayersCount--;
        if (window.loadingLayersCount <= 0) {
            resetLoading();
        }
    });

    // Also update zoom hint on map movement
    document.addEventListener('DOMContentLoaded', () => {
        const checkZoom = () => {
            if (window.map) {
                const currentZoom = window.map.getZoom();
                if (currentZoom >= 12) {
                    $('#zoomHint').addClass('hidden');
                } else if (window.loadingLayersCount > 0) {
                    $('#zoomHint').removeClass('hidden');
                }
            }
        };
        
        // Polling check since map might be init async
        const interval = setInterval(() => {
            if (window.map) {
                window.map.on('zoomend', checkZoom);
                clearInterval(interval);
            }
        }, 1000);
    });

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        if (window.showToast) {
            window.showToast('Sistem mengalami kendala teknis. Mohon segarkan halaman.', 'error', 5000);
        }
        return false;
    };
</script>
@endpush
