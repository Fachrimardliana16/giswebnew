/**
 * Toggle sidebar section visibility and rotation of its icon
 * @param {string} id 
 */
export function toggleSection(id) {
    const content = document.getElementById(`content-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    
    if (content && icon) {
        const isHidden = content.classList.contains('hidden');
        
        if (isHidden) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
        }
    }
}

/**
 * Mobile Sidebar Toggle Logic
 */
export function initMobileToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    if (toggleBtn && sidebar && backdrop) {
        const toggleSidebar = () => {
            const isOpen = !sidebar.classList.contains('-translate-x-full');
            
            if (!isOpen) {
                // Open
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                backdrop.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                // Close
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

// Make globally accessible for inline onclick handlers (Blade components)
window.toggleSection = toggleSection;
