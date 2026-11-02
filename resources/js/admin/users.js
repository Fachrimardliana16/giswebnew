/**
 * Manajemen pengguna (halaman admin).
 *
 * Semua listener dipasang di sini, bukan onclick= inline:
 * CSP memblokir inline handler tanpa error yang terlihat di UI,
 * sehingga tombol jadi mati diam-diam.
 */

const SEL_ALL = '#selectAll';
const SEL_ROW = '.user-checkbox';

export function initUserTable() {
    const selectAll = document.querySelector(SEL_ALL);
    const bulkBtn = document.getElementById('bulkDeleteBtn');
    const selectedCount = document.getElementById('selectedCount');

    const updateBulkButton = () => {
        const n = document.querySelectorAll(`${SEL_ROW}:checked`).length;
        if (selectedCount) selectedCount.textContent = n;
        if (bulkBtn) bulkBtn.classList.toggle('hidden', n === 0);
    };

    if (selectAll) {
        selectAll.addEventListener('change', () => {
            document.querySelectorAll(SEL_ROW).forEach(cb => { cb.checked = selectAll.checked; });
            updateBulkButton();
        });
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList && e.target.classList.contains('user-checkbox')) {
            updateBulkButton();
        }
    });

    // --- buka / tutup modal ---
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById(btn.dataset.modalOpen);
            if (modal) modal.classList.remove('hidden');
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById(btn.dataset.modalClose);
            if (modal) modal.classList.add('hidden');
        });
    });

    // Klik latar modal menutupnya
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });

    // --- edit user ---
    document.querySelectorAll('[data-user-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            let user;
            try {
                user = JSON.parse(btn.dataset.userEdit);
            } catch (err) {
                console.error('data-user-edit tidak valid', err);
                return;
            }

            const form = document.getElementById('editUserForm');
            if (form) form.action = '/settings/users/' + user.id;

            const set = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val ?? '';
            };
            set('edit_name', user.name);
            set('edit_username', user.username);
            set('edit_role_id', user.role_id);

            document.getElementById('editUserModal')?.classList.remove('hidden');
        });
    });

    // --- hapus user ---
    document.querySelectorAll('[data-user-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
            const form = document.getElementById('deleteUserForm');
            if (!form) return;
            form.action = '/settings/users/' + btn.dataset.userDelete;
            form.submit();
        });
    });

    // --- hapus massal ---
    document.querySelectorAll('[data-bulk-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Apakah Anda yakin ingin menghapus user yang terpilih secara massal?')) return;
            const form = document.getElementById('bulkDeleteForm');
            if (!form) return;

            form.querySelectorAll('input[name="ids[]"]').forEach(el => el.remove());
            document.querySelectorAll(`${SEL_ROW}:checked`).forEach(cb => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'ids[]';
                input.value = cb.value;
                form.appendChild(input);
            });
            form.submit();
        });
    });
}
