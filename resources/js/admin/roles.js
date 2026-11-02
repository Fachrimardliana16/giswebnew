/**
 * Manajemen role (halaman admin).
 *
 * Listener dipasang di sini, bukan onclick= inline — CSP memblokir
 * inline handler sehingga tombol mati tanpa pesan.
 */

const SEL_ALL = '#selectAll';
const SEL_ROW = '.role-checkbox';

export function initRoleTable() {
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
        if (e.target.classList && e.target.classList.contains('role-checkbox')) {
            updateBulkButton();
        }
    });

    // --- modal ---
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.modalOpen)?.classList.remove('hidden');
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.modalClose)?.classList.add('hidden');
        });
    });

    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });

    // --- edit role ---
    document.querySelectorAll('[data-role-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            let role;
            try {
                role = JSON.parse(btn.dataset.roleEdit);
            } catch (err) {
                console.error('data-role-edit tidak valid', err);
                return;
            }

            const form = document.getElementById('editRoleForm');
            if (form) form.action = '/settings/roles/' + role.id;

            const nama = document.getElementById('edit_name');
            if (nama) nama.value = role.name || '';

            document.querySelectorAll('#edit_permissions_container input[type="checkbox"]')
                .forEach(cb => { cb.checked = false; });

            if (Array.isArray(role.permissions)) {
                role.permissions.forEach(perm => {
                    const cb = document.getElementById('edit_perm_' + perm);
                    if (cb) cb.checked = true;
                });
            }

            document.getElementById('editRoleModal')?.classList.remove('hidden');
        });
    });

    // --- hapus role ---
    document.querySelectorAll('[data-role-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Apakah Anda yakin ingin menghapus role ini? Pastikan tidak ada user yang menggunakan role ini.')) return;
            const form = document.getElementById('deleteRoleForm');
            if (!form) return;
            form.action = '/settings/roles/' + btn.dataset.roleDelete;
            form.submit();
        });
    });

    // --- hapus massal ---
    document.querySelectorAll('[data-bulk-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Apakah Anda yakin ingin menghapus role yang terpilih secara massal? Role yang masih memiliki pengguna akan dilewati.')) return;
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
