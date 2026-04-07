/**
 * Render a stunning premium feature popup HTML for both Search and Map Clicks
 * @param {string} title - The main title (e.g. Customer Name)
 * @param {Object} props - Feature properties object
 * @param {number} lat - Latitude for Google Maps directions
 * @param {number} lng - Longitude for Google Maps directions
 * @returns {string} HTML string
 */
export function renderFeaturePopup(title, props, lat, lng) {
    const formattedTitle = (title || 'Detail Informasi').replace(/_/g, ' ');
    
    // Label Mapping
    const labelMapping = {
        'wm_no_seri': 'No Seri WM',
        'wm_merek': 'Merk WM',
        'drd_pemakaian': 'Kubikasi Pemakaian',
        'tungg_lembar': 'Lembar Tunggakan',
        'tungg_rp_tagihan': 'Nominal Tagihan',
        'bacameter_tglbaca': 'Tanggal Pembacaan',
        'bacameter_namacater': 'Nama Cater',
        'isvalid': 'Validasi',
        'debit': 'Debit Air',
        'umurwm_tahun': 'Umur Water Meter'
    };

    /**
     * Format Value based on Key
     */
    const formatValue = (key, value) => {
        if (value === null || value === undefined || value === '') return '-';
        
        const lowerKey = key.toLowerCase();
        
        // Umur WM Formatting
        if (lowerKey === 'umurwm_tahun') {
            return `${value} Tahun`;
        }
        
        // Date Formatting (Remove Z and T)
        if (lowerKey === 'bacameter_tglbaca' || lowerKey.includes('tgl')) {
            try {
                const date = new Date(value);
                if (!isNaN(date)) {
                    return date.toLocaleString('id-ID', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric'
                    });
                }
            } catch (e) {}
            return String(value).replace('Z', '').replace('T', ' ');
        }

        // Debit Formatting (to Integer + m3)
        if (lowerKey === 'debit') {
            const val = parseFloat(value);
            return isNaN(val) ? value : `${Math.floor(val)} m³`;
        }

        return value;
    };

    let content = `
        <div class="px-0.5 py-0.5 min-w-[250px] sm:min-w-[300px] max-w-[280px] sm:max-w-[340px] font-sans selection:bg-emerald-100">
            <!-- Glassmorphic Header Card -->
            <div class="relative overflow-hidden bg-slate-900 rounded-2xl p-4 sm:p-5 mb-3 sm:mb-5 shadow-2xl shadow-slate-300">
                <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-2.5 mb-2 sm:mb-3">
                        <div class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
                            <span class="text-[8px] font-black text-emerald-400 uppercase tracking-[0.25em]">Verified Data</span>
                        </div>
                    </div>
                    <h3 class="text-base sm:text-lg font-black text-white leading-tight uppercase tracking-tight truncate">${formattedTitle}</h3>
                </div>
            </div>

            <!-- Detail List with Refined Spacing -->
            <div class="space-y-0.5 mb-4 sm:mb-6 max-h-[220px] sm:max-h-[320px] overflow-y-auto px-1 custom-scrollbar">
    `;

    // Filter and add properties
    const excludedKeys = ['id', 'geom', 'geometry', 'id_0', 'objectid', 'shape_leng', 'shape_area', 'fid', 'point_x', 'point_y', 'nama'];
    
    for (const key in props) {
        if (props[key] !== null && props[key] !== undefined && props[key] !== '' && !excludedKeys.includes(key.toLowerCase())) {
            const label = labelMapping[key.toLowerCase()] || key.replace(/_/g, ' ').toUpperCase();
            const value = formatValue(key, props[key]);
            
            content += `
                <div class="flex items-center justify-between py-2.5 sm:py-3 border-b border-slate-100 last:border-0 group hover:bg-slate-50/50 rounded-xl px-2 transition-all">
                    <span class="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">${label}</span>
                    <span class="text-[10px] sm:text-[11px] font-bold text-slate-800 text-right max-w-[140px] sm:max-w-[160px] truncate">${value}</span>
                </div>
            `;
        }
    }

    content += `
            </div>

            <!-- Stunning Floating Navigation Button -->
            <div class="px-1 pb-1">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" 
                   class="relative group block w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">
                    <div class="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    <div class="relative flex items-center justify-center gap-3 py-3 sm:py-4 text-white">
                        <div class="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">Navigasi</span>
                    </div>
                </a>
            </div>
        </div>
    `;

    return content;
}
