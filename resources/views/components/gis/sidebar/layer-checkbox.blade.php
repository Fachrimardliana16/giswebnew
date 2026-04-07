@props(['id', 'label', 'checked' => false])

<div class="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg group transition-all duration-200 border border-transparent hover:border-slate-100">
    <div class="relative flex items-center">
        <input type="checkbox" id="{{ $id }}" {{ $checked ? 'checked' : '' }} {{ $attributes->merge(['class' => 'layer-checkbox w-4.5 h-4.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-all cursor-pointer shadow-sm']) }}>
    </div>
    <label for="{{ $id }}" class="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 cursor-pointer transition-colors leading-tight uppercase tracking-wide">{{ $label }}</label>
</div>
