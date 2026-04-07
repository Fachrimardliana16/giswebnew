/**
 * Toast Notification System
 * Modern, non-blocking notifications for the GIS application.
 */

export const showToast = (message, type = 'info', duration = 3000) => {
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

    toast.innerHTML = `
        <div class="flex-shrink-0">${icon}</div>
        <div class="text-[11px] font-black uppercase tracking-wider text-slate-700">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
            if (container.childNodes.length === 0) {
                container.remove();
            }
        }, 300);
    }, duration);
};

// Global helper for quick access
window.showToast = showToast;
