@props(['title', 'id', 'open' => false])

<div {{ $attributes->merge(['class' => 'space-y-1 mb-1']) }}>
    <div class="sidebar-section-header group flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100"
         role="button" tabindex="0" aria-expanded="{{ $open ? 'true' : 'false' }}" aria-controls="content-{{ $id }}"
         data-section-toggle="{{ $id }}">
        <h3 class="font-black text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">{{ $title }}</h3>
        <div class="bg-slate-50 p-1 rounded-md border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
            <svg id="icon-{{ $id }}" class="w-3 h-3 text-slate-400 group-hover:text-blue-500 transform transition-transform duration-300 {{ $open ? 'rotate-180' : '' }}" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        </div>
    </div>
    <div id="content-{{ $id }}" class="px-2 pt-1 pb-2 space-y-1 {{ $open ? '' : 'hidden' }}">
        {{ $slot }}
    </div>
</div>
