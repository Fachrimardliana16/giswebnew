import { initUserTable } from './admin/users.js';
import { initRoleTable } from './admin/roles.js';

/**
 * Entry untuk halaman admin. Tidak memuat modul peta.
 *
 * PENTING: hanya inisialisasi modul yang memang ada di halaman ini.
 * Kedua modul memakai id yang sama (#selectAll, #bulkDeleteBtn,
 * #selectedCount); menjalankan keduanya membuat handler kedua
 * menimpa counter dengan angka 0.
 */
function boot() {
    const punyaUsers = document.querySelector('.user-checkbox') !== null;
    const punyaRoles = document.querySelector('.role-checkbox') !== null;

    if (punyaUsers) initUserTable();
    if (punyaRoles) initRoleTable();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
