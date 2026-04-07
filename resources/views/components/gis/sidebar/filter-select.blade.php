@props(['id', 'label', 'options' => []])

<div class="space-y-1.5">
    @if($label)
        <label for="{{ $id }}" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{{ $label }}</label>
    @endif
    <div class="relative group">
        <select id="{{ $id }}" {{ $attributes->merge(['class' => 'w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm group-hover:border-slate-300']) }}>
            {{ $slot }}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-300 group-hover:text-blue-500 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </div>
    </div>
</div>
