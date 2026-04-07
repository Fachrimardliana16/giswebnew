@extends('layouts.app')

@section('content')
    <div class="flex-1 relative overflow-hidden group">
        <div id="map" class="absolute inset-0"></div>
        
        <!-- Custom Base Map Toggle (Simple UI) -->
        <div class="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
            <button id="baseMapToggle" class="flex items-center gap-3 px-4 py-3 bg-glass border border-white/30 rounded-2xl shadow-premium hover:scale-105 active:scale-95 transition-all group overflow-hidden">
                <div class="w-9 h-9 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white shadow-inner" id="baseMapIcon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div class="flex flex-col items-start">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Visualisasi</span>
                    <span class="text-xs font-black text-slate-700 uppercase tracking-tight" id="baseMapLabel">Satelit</span>
                </div>
            </button>
        </div>
        
        <!-- Loading indicator -->
        <div id="loadingIndicator" class="hidden absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div class="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
            </div>
        </div>
    </div>
@endsection

@push('scripts')
<script>
    $(document).ajaxStart(function() {
        $('#loadingIndicator').removeClass('hidden');
    }).ajaxStop(function() {
        $('#loadingIndicator').addClass('hidden');
    });

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo);
        return false;
    };
</script>
@endpush
