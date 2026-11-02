# 01 — RENCANA UJI (Test Plan)

**Proyek:** webgisupdate (`github.com/Fachrimardliana16/giswebnew`)
**Lokasi:** `D:\Projects\webgisupdate`
**Stack:** Laravel 11.31 · PHP 8.5.12 · SQLite (dev) · Vite 6 + Tailwind 3 · Leaflet 1.9.4 (CDN)
**Basis data produksi:** PostgreSQL eksternal `36.93.220.245:9191/gistirtaperwira2025` (dipakai sebagai user-store)
**Lingkungan uji:** lokal `http://127.0.0.1:8123`
**Tanggal:** 2 November 2026

---

## Cakupan route (enumerasi penuh — 17 route)

| # | Method | Path | Name | Middleware |
|---|--------|------|------|-----------|
| R1 | GET | `/` | – | web |
| R2 | GET | `/login` | login | web |
| R3 | POST | `/login` | – | web |
| R4 | GET | `/logout` | logout | web |
| R5 | GET | `/dashboard` | dashboard | web, auth |
| R6 | GET | `/geo-proxy` | geo.proxy | web, auth |
| R7 | GET | `/settings/users` | users.index | web, auth, admin.access |
| R8 | POST | `/settings/users` | users.store | web, auth, admin.access |
| R9 | PUT | `/settings/users/{user}` | users.update | web, auth, admin.access |
| R10 | DELETE | `/settings/users/{user}` | users.destroy | web, auth, admin.access |
| R11 | POST | `/settings/users/bulk-delete` | users.bulkDestroy | web, auth, admin.access |
| R12 | GET | `/settings/roles` | roles.index | web, auth, admin.access |
| R13 | POST | `/settings/roles` | roles.store | web, auth, admin.access |
| R14 | PUT | `/settings/roles/{role}` | roles.update | web, auth, admin.access |
| R15 | DELETE | `/settings/roles/{role}` | roles.destroy | web, auth, admin.access |
| R16 | POST | `/settings/roles/bulk-delete` | roles.bulkDestroy | web, auth, admin.access |
| R17 | GET | `/up` | – | health |

**17/17 route diuji.** Tidak ada panel admin yang terlewat.

---

## A. Halaman publik & autentikasi

| ID | Skenario | Langkah | Harapan |
|----|----------|---------|---------|
| A1 | Root redirect | GET `/` | 302 → `/login` |
| A2 | Halaman login render | GET `/login` | 200, form + CSRF |
| A3 | Login sukses | POST kredensial valid | 302 → `/dashboard`, sesi baru |
| A4 | Login salah | POST password salah | kembali + pesan "Login gagal" |
| A5 | Rate limit | 12× password salah | attempt ≤5 diproses, ke-6+ ditolak |
| A6 | CSRF rotate | POST dgn token pra-login | 419 |
| A7 | Logout | GET `/logout` | sesi hangus, redirect `/login` |
| A8 | Health | GET `/up` | 200 |

## B. Kontrol akses (RBAC)

| ID | Skenario | Harapan |
|----|----------|---------|
| B1 | GET admin tanpa login | 302 → `/login` |
| B2 | GET `/settings/users` sbg non-admin | 302 → `/dashboard` |
| B3 | GET `/settings/roles` sbg non-admin | 302 → `/dashboard` |
| B4 | POST `/settings/users` sbg non-admin | ditolak, 0 baris dibuat |
| B5 | PUT role diri sendiri sbg non-admin (privilege escalation) | ditolak |
| B6 | DELETE user lain sbg non-admin | ditolak |
| B7 | POST `/settings/roles` sbg non-admin | ditolak |
| B8 | Non-admin tak boleh lihat menu admin di sidebar | menu tersembunyi |

## C. Keamanan transport & header

| ID | Skenario | Harapan |
|----|----------|---------|
| C1 | Header `X-Frame-Options` | ada |
| C2 | Header `Content-Security-Policy` | ada |
| C3 | Header `X-Content-Type-Options` | ada |
| C4 | Header `Strict-Transport-Security` (produksi) | ada |
| C5 | Cookie `Secure` | ada di HTTPS |
| C6 | 404 path acak | 404, bukan 500 |

## D. Injeksi & eksposur data

| ID | Skenario | Harapan |
|----|----------|---------|
| D1 | CQL injection ke `/geo-proxy` | input divalidasi |
| D2 | WFS `GetFeature` tanpa `maxFeatures` | dibatasi |
| D3 | WMS `GetMap` 20000×20000 | ditolak aplikasi |
| D4 | Kebocoran pesan exception ke klien | tidak ada |
| D5 | Password tersimpan di session | tidak ada |
| D6 | Kredensial hardcoded di repo | tidak ada |

## E. Performa & kesehatan sistem

| ID | Skenario | Metrik |
|----|----------|--------|
| E1 | TTFB halaman server-rendered | < 200 ms |
| E2 | Byte transfer initial load | < 500 KB |
| E3 | Request CDN eksternal (single point of failure) | 0 |
| E4 | Autoload 126 user pada halaman admin | < 1 s / tak menggantung |
| E5 | Dependensi dengan CVE | 0 |

## F. Tampilan (UI/UX + aksesibilitas)

| ID | Skenario | Harapan |
|----|----------|---------|
| F1 | Overflow horizontal desktop 764 px | tidak ada |
| F2 | Overflow horizontal mobile 390 px | tidak ada |
| F3 | Sidebar off-canvas mobile + tombol buka | berfungsi |
| F4 | Peta mengisi area konten | tinggi > 300 px |
| F5 | Tombol ikon punya label aksesibel | semua |
| F6 | Kontrol interaktif hidup (accordion, dropdown, toggle basemap) | bereaksi |
| F7 | Heading `<h1>` per halaman | 1 per halaman |
| F8 | Halaman admin tanpa peta: tidak memuat Leaflet | ya |

## G. Fungsi & aturan bisnis

| ID | Skenario | Harapan |
|----|----------|---------|
| G1 | Filter pelanggan → CQL terkirim | parameter benar |
| G2 | Filter pipa butuh minimal satu pilihan | layer tersembunyi bila kosong |
| G3 | Pencarian pelanggan (nama/nolangg) | hasil tampil + marker |
| G4 | Klik peta → GetFeatureInfo bertingkat | popup informasi |
| G5 | Hapus role yang masih punya user | ditolak + pesan |
| G6 | Hapus diri sendiri / user terlindungi | ditolak |
| G7 | Role/permission apakah mengekang akses? | ya |
| G8 | "Ingat saya" menyimpan sesi | ya |
| G9 | "Lupa Password?" | berfungsi |
| G10 | Tombol "Profil Saya" | berfungsi |

---

*Setiap baris di atas punya hasil terukur di `02-laporan-audit.md`.*
