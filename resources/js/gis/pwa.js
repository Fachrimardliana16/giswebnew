/**
 * PWA: registrasi service worker, tombol install, indikator offline.
 *
 * Catatan penting:
 *  - sw.js HARUS diambil tanpa cache. Kalau tidak, versi baru tidak akan
 *    pernah terpakai (masalah klasik PWA). Route /sw.js sudah mengirim
 *    Cache-Control: no-cache.
 *  - Versi ikut di URL registrasi (/sw.js?v=...) supaya perubahan versi
 *    memaksa browser memasang worker baru.
 */

import { showToast } from './toast.js';

const VERSI_SW = 'v5-2026-11-02';

let promptInstall = null;

function buatTombolInstall() {
    if (document.getElementById('pwaInstallBtn')) return null;

    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.type = 'button';
    btn.className = 'pwa-install';
    btn.setAttribute('aria-label', 'Pasang aplikasi ke layar utama');
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4"></path>
            <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"></path>
        </svg>
        <span>Pasang Aplikasi</span>
    `;
    document.body.appendChild(btn);

    btn.addEventListener('click', async () => {
        if (!promptInstall) {
            showToast('Gunakan menu browser → "Tambahkan ke layar utama"', 'info', 4000);
            return;
        }
        promptInstall.prompt();
        const { outcome } = await promptInstall.userChoice;
        promptInstall = null;
        btn.remove();
        if (outcome === 'accepted') {
            showToast('Aplikasi berhasil dipasang', 'success', 3000);
        }
    });

    return btn;
}

function pantauInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // tahan prompt bawaan, tampilkan tombol sendiri
        e.preventDefault();
        promptInstall = e;
        buatTombolInstall();
    });

    window.addEventListener('appinstalled', () => {
        document.getElementById('pwaInstallBtn')?.remove();
        promptInstall = null;
        showToast('WebGIS terpasang di perangkat Anda', 'success', 3000);
    });
}

function pantauOffline() {
    const tampilkan = (offline) => {
        let bilah = document.getElementById('offlineBar');

        if (offline) {
            if (!bilah) {
                bilah = document.createElement('div');
                bilah.id = 'offlineBar';
                bilah.className = 'offline-bar';
                bilah.setAttribute('role', 'status');
                bilah.textContent = 'Mode offline — memakai data tersimpan';
                document.body.appendChild(bilah);
            }
            bilah.dataset.show = '1';
        } else if (bilah) {
            bilah.dataset.show = '0';
            setTimeout(() => bilah.remove(), 400);
        }
    };

    window.addEventListener('offline', () => tampilkan(true));
    window.addEventListener('online', () => {
        tampilkan(false);
        showToast('Kembali online', 'success', 2500);
    });

    if (!navigator.onLine) tampilkan(true);
}

export function initPwa() {
    if (!('serviceWorker' in navigator)) return;

    pantauInstall();
    pantauOffline();

    // Daftarkan setelah halaman siap agar tidak menahan render
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(`/sw.js?v=${VERSI_SW}`, { scope: '/' })
            .then((reg) => {
                // periksa pembaruan saat aplikasi dibuka
                reg.update().catch(() => {});

                // Kalau ada worker baru menunggu, aktifkan & ambil kendali
                // agar pengguna tidak terjebak memakai cache lama.
                reg.addEventListener('updatefound', () => {
                    const baru = reg.installing;
                    if (!baru) return;
                    baru.addEventListener('statechange', () => {
                        if (baru.state === 'installed' && navigator.serviceWorker.controller) {
                            baru.postMessage({ type: 'LEWATI_TUNGGU' });
                        }
                    });
                });
            })
            .catch((err) => {
                console.warn('Service worker gagal didaftarkan:', err);
            });
    });

    // Ambil kendali segera setelah worker baru aktif, tanpa perlu reload manual
    let sudahMuatUlang = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (sudahMuatUlang) return;
        sudahMuatUlang = true;
        // hanya muat ulang bila sebelumnya memang sudah ada controller
        if (window.__swSudahAda) {
            location.reload();
        }
    });
    window.__swSudahAda = Boolean(navigator.serviceWorker.controller);

    // Kalau ada worker baru menunggu, aktifkan langsung
    navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'CACHE_DIBERSIHKAN') {
            showToast('Cache aplikasi dibersihkan', 'info', 2500);
        }
    });
}

/** Hapus semua cache PWA (dipakai saat logout / debug). */
export async function bersihkanCachePwa() {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active) {
        reg.active.postMessage({ type: 'BERSIHKAN_CACHE' });
    }
}
