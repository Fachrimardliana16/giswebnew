/**
 * Toggle sidebar section visibility and rotation of its icon
 * @param {string} id 
 */
export function toggleSection(id) {
    const content = document.getElementById(`content-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    const header = document.querySelector(`[data-section-toggle="${id}"]`);

    if (content && icon) {
        const isHidden = content.classList.contains('hidden');

        if (isHidden) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
            if (header) header.setAttribute('aria-expanded', 'true');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
            if (header) header.setAttribute('aria-expanded', 'false');
        }
    }
}

/**
 * Pasang listener accordion sidebar.
 *
 * Tidak memakai onclick= inline karena CSP (script-src tanpa unsafe-inline)
 * memblokirnya tanpa pesan yang terlihat — tombol jadi mati diam-diam.
 */
export function initSidebarSections() {
    document.querySelectorAll('[data-section-toggle]').forEach(header => {
        const id = header.getAttribute('data-section-toggle');

        header.addEventListener('click', () => toggleSection(id));
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection(id);
            }
        });
    });
}

/**
 * Mobile Sidebar Toggle Logic
 */
export function initMobileToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');

    // Di mobile, sidebar dikelola mobileApp.js sebagai bottom sheet.
    // Toggle lama hanya untuk lebar desktop/tablet.
    const desktopOnly = () => window.matchMedia('(min-width: 768px)').matches;

    if (toggleBtn && sidebar && backdrop) {
        const toggleSidebar = () => {
            if (!desktopOnly()) return;
            const isOpen = !sidebar.classList.contains('-translate-x-full');

            if (!isOpen) {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                backdrop.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('translate-x-0');
                backdrop.classList.add('hidden');
                document.body.style.overflow = '';
            }
        };

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });

        backdrop.addEventListener('click', () => {
            toggleSidebar();
        });
    }
}

/**
 * Profile Dropdown Toggle Logic
 */
export function initProfileDropdown() {
    const container = document.getElementById('profileContainer');
    const toggleBtn = document.getElementById('profileToggle');
    const dropdown = document.getElementById('profileDropdown');

    if (toggleBtn && dropdown) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');

            if (isHidden) {
                // Show
                dropdown.classList.remove('hidden');
                setTimeout(() => {
                    dropdown.classList.remove('opacity-0', 'scale-95');
                    dropdown.classList.add('opacity-100', 'scale-100');
                }, 10);
            } else {
                // Hide
                dropdown.classList.add('opacity-0', 'scale-95');
                dropdown.classList.remove('opacity-100', 'scale-100');
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 200);
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (dropdown.classList.contains('hidden')) return;

            // Klik pada kontrol mobile shell tidak dianggap "di luar"
            const diShell = e.target.closest && e.target.closest(
                '[data-bottom-nav], [data-sheet-backdrop], .sidebar-sheet'
            );
            if (diShell) return;

            if (!container.contains(e.target)) {
                dropdown.classList.add('opacity-0', 'scale-95');
                dropdown.classList.remove('opacity-100', 'scale-100');
                setTimeout(() => {
                    dropdown.classList.add('hidden');
                }, 200);
            }
        });
    }
}

/**
 * Mobile Search Toggle Logic
 */
export function initMobileSearch() {
    const toggleBtn = document.getElementById('mobileSearchToggle');
    const container = document.getElementById('mobileSearchContainer');
    const input = document.getElementById('mobileCustomerSearchInput');

    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = container.classList.contains('active');
            
            if (!isActive) {
                container.classList.add('active');
                if (input) setTimeout(() => input.focus(), 300);
            } else {
                container.classList.remove('active');
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && container.classList.contains('active')) {
                container.classList.remove('active');
            }
        });
    }
}

// Make globally accessible for inline onclick handlers (Blade components)
window.toggleSection = toggleSection;
