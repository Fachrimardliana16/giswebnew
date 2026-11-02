/**
 * Toast Notification System
 * Modern, non-blocking notifications for the GIS application.
 *
 * Mendukung tombol aksi opsional:
 *   showToast('...', 'error', 0, { aksi: 'Muat ulang', onAksi: fn })
 * duration = 0 berarti toast TIDAK hilang otomatis (harus diklik/ditutup).
 */

export const showToast = (message, type = 'info', duration = 3000, opsi = {}) => {
    let container = document.getElementById('toast-container');

    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    // Icon selection
    let icon = '';
    if (type === 'error') icon = '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    else if (type === 'success') icon = '<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
    else if (type === 'warning') icon = '<svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    else icon = '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    // Teks di-escape: pesan bisa memuat nama berkas/URL dari luar
    const aman = String(message).replace(/[<>&"']/g, (c) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
    }[c]));

    toast.innerHTML = `
        <div class="flex-shrink-0">${icon}</div>
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">${aman}</div>
    `;

    // Tombol aksi opsional
    if (opsi.aksi) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-item__aksi';
        btn.textContent = opsi.aksi;
        btn.addEventListener('click', () => {
            try {
                opsi.onAksi && opsi.onAksi();
            } finally {
                hapus();
            }
        });
        toast.appendChild(btn);
    }

    // Tombol tutup bila toast tidak hilang otomatis
    if (!duration) {
        const tutup = document.createElement('button');
        tutup.type = 'button';
        tutup.className = 'toast-item__tutup';
        tutup.setAttribute('aria-label', 'Tutup pemberitahuan');
        tutup.innerHTML = '&times;';
        tutup.addEventListener('click', () => hapus());
        toast.appendChild(tutup);
    }

    container.appendChild(toast);

    let timer = null;

    const hapus = () => {
        if (!toast.isConnected) return;
        if (timer) clearTimeout(timer);
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
            if (container.childNodes.length === 0) {
                container.remove();
            }
        }, 300);
    };

    // Auto remove (duration 0 = permanen)
    if (duration > 0) {
        timer = setTimeout(hapus, duration);
    }

    return { hapus };
};

// Global helper for quick access
window.showToast = showToast;
