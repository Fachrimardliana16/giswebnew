# 02 — LAPORAN AUDIT

**Proyek:** webgisupdate (WebGIS Tirta Perwira / PDAM Purbalingga)
**Repo:** `github.com/Fachrimardliana16/giswebnew` @ `d9d5d6d`
**Lokal:** `D:\Projects\webgisupdate` · uji di `http://127.0.0.1:8123`
**Tanggal uji:** 2 Nov 2026 · PHP 8.5.12 · Laravel 11.31 · SQLite dev
**Cakupan:** 17/17 route diuji · 61/61 butir test plan dieksekusi

---

## Ringkasan eksekutif

| Area | Status | Temuan |
|------|--------|--------|
| Keamanan | **MERAH** | 3 kritis, 5 tinggi, 4 sedang |
| Tampilan / UI | **KUNING** | layout solid, 5 tombol tanpa label, aset dari 3 CDN |
| Performa & kesehatan | **KUNING** | TTFB 43 ms bagus, tapi 44 dep CVE + autoload 26 s |
| Kode & struktur | **KUNING** | terstruktur baik, tapi ~900 LOC mati / logika bisnis tanpa test |
| Fungsi & aturan bisnis | **MERAH** | 4 fitur UI mati, hak akses tak terpakai, self-delete bocor |

**Angka kunci:** 44 advisory CVE di 12 paket (5 kritis/tinggi di `laravel/framework`) · 44,6 MB data pelanggan bocor via satu GET · 0 security header · 126 user di-seed dengan password identik · 0 test nyata.

---

## 1. TEMUAN KEAMANAN

### SEC-01 — WFS `/geo-proxy` membocorkan seluruh data pelanggan (KRITIS)

**Bukti eksekusi:**
```
GET /geo-proxy?service=WFS&version=1.0.0&request=GetFeature
    &typeName=webgis:analisa_pelanggan&outputFormat=application/json
→ HTTP 200, 44.609.185 byte (44,6 MB), 8.097 ms
```
Isi respons memuat `nolang`, `nama` (mis. "HARDIMAN"), `alamat` ("AW.SUMARMO PBG.KDL RT.4/2"), `tarif`, nomor & merek water meter. Ini adalah **data pribadi pelanggan PDAM**, bukan data peta.

**Penyebab:** `GeoServerProxyController::proxy()` meneruskan `$request->query()` mentah ke GeoServer tanpa allowlist parameter, tanpa batas `maxFeatures`, tanpa cek role. Siapa pun yang punya akun (termasuk akun role `user`/`viewer`) bisa memanen seluruh basis data.

**Perbaikan:**
```php
// app/Http/Controllers/GeoServerProxyController.php
$allowed = ['service','version','request','layers','query_layers','styles',
            'format','transparent','srs','bbox','width','height','x','y',
            'info_format','typeName','outputFormat','cql_filter'];
$params = array_intersect_key($request->query(), array_flip($allowed));

// paksa batas pada GetFeature
if (strtoupper($params['request'] ?? '') === 'GETFEATURE') {
    $params['maxFeatures'] = min((int) ($params['maxFeatures'] ?? 10), 50);
    $params['propertyName'] = 'nama,nolang,status,cabang';   // whitelist kolom
}
```

---

### SEC-02 — Password plaintext disimpan di session (KRITIS)

**Kode:** `app/Auth/PgsqlUserProvider.php:46`
```php
session(['pgsql_user' => $username, 'pgsql_pass' => $password]);
```
Password user (yang juga password PostgreSQL) ditulis ke session. Session Laravel di-*encrypt* dengan `APP_KEY` (AES-256-CBC), tetapi:
- terbaca oleh siapa pun yang memegang `APP_KEY` atau akses tabel `sessions`;
- bertahan selama `SESSION_LIFETIME` (120 menit);
- `config('app.debug')` terbuka pada dump session (`dd(session()->all())`).

**Bukti:** probe `sessions` sekarang 0 baris berisi `pgsql_pass` sejak login admin lama — **bukan** karena kode aman, tetapi karena `DB_CONNECTION` dev = SQLite sehingga jalur PDO pgsql tidak sempat diisi. Di produksi kode ini mengisi session.

**Perbaikan:** jangan simpan password sama sekali. Kalau butuh koneksi per-user, buat token berumur pendek di tabel terpisah + hapus saat logout.

---

### SEC-03 — Autentikasi = "bisa konek ke PostgreSQL", bukan verifikasi kredensial (KRITIS)

**Kode:** `PgsqlUserProvider::validateCredentials()` — `return true` bila `new PDO(...)` tidak melempar exception.

Artinya: login = "berhasil membuat koneksi psql". Konsekuensi terukur:
- user yang butuh **hanya SELECT** tetap lolos;
- tidak ada pemeriksaan apakah akun aktif / boleh masuk aplikasi;
- `DatabaseUser` tak menyimpan role → semua user yang login lewat jalur ini tidak punya otorisasi granular;
- `DB_HOST` `36.93.220.245:9191` **terbuka dari internet** (terukur: `connect 36.93.220.245:9191 → TERBUKA 16 ms`). Ini port PostgreSQL publik — sebaiknya ditutup, tidak untuk diakses browser/aplikasi publik.

**Perbaikan:** verifikasi lewat fungsi/`SELECT` pada tabel user aplikasi (bukan superuser psql), pisahkan koneksi *verify* dan koneksi *runtime*, dan tutup 9191 dari internet (tunnel/VPN/allowlist firewall).

---

### SEC-04 — `verify => false` mematikan verifikasi TLS ke upstream (TINGGI)

**Kode:** `GeoServerProxyController.php`
```php
Http::withOptions(['verify' => false])->timeout(60)->get($targetUrl, ...)
```
Server-to-server tanpa validasi sertifikat = MITM. **Perbaikan:** `verify => true` (atau path CA). Kalau upstream memang HTTP polos, perbaiki sisi upstream, bukan mematikan verifikasi.

---

### SEC-05 — Kebocoran pesan exception ke klien (TINGGI)

```php
} catch (\Exception $e) {
    return response()->json(['error' => 'Proxy Fail: ' . $e->getMessage()], 500);
}
```
Membocorkan DSN, path, dan pesan internal. **Perbaikan:** log penuh di server, klien hanya `'Proxy gagal memproses permintaan'`.

---

### SEC-06 — Otorisasi berbasis username hardcoded di 3 tempat (TINGGI)

Tiga sumber kebenaran berbeda, tidak sinkron:
- `AdminAccessMiddleware`: `['fachri','kholiq','aulia']`
- `UserController::bulkDestroy`: `['fachri','kholiq','aulia']`
- `partials/sidebar.blade.php`: `['fachri','kholiq','aulia']`
- sedangkan seeder & DB menandai **6** admin (`fachri, kholiq, aulia, pdamadmin, postgres` + role `admin`).

**Terukur:** `suyadi` (role `user`) → GET/POST `/settings/*` = 302 ke `/dashboard`. **Tidak bocor**, tetapi:
- `pdamadmin` & `postgres` (role `admin` di DB) **tidak** bisa masuk panel admin;
- `role.permissions` (kolom JSON, 6 permission) **tidak dipakai di kode mana pun** (0 referensi);
- menambah admin = ubah kode + deploy.

**Perbaikan:** pakai `role_id`/`permissions`, hapus whitelist username:
```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();
    abort_unless($user && ($user->role?->name === 'admin'
        || in_array('manajemen_user', $user->role?->permissions ?? [])), 403);
    return $next($request);
}
```

---

### SEC-07 — Nol security header (TINGGI)

**Bukti:** `curl -sD - /login | grep -iE 'x-frame|x-content-type|content-security|strict-transport|referrer'` → **kosong**.

Absen: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`. Aplikasi bisa di-*iframe* (clickjacking) dan tidak membatasi sumber script — padahal sudah memuat 3 CDN eksternal.

**Perbaikan:** middleware header global:
```php
$response->headers->add([
    'X-Frame-Options' => 'DENY',
    'X-Content-Type-Options' => 'nosniff',
    'Referrer-Policy' => 'strict-origin-when-cross-origin',
    'Content-Security-Policy' => "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data: https://*.tile.openstreetmap.org https://mt1.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com",
]);
```

---

### SEC-08 — 126 akun di-seed dengan password identik `password` (TINGGI)

**Kode:** `database/seeders/UserSeeder.php`
```php
'password' => Hash::make('password'),
```
126 user (termasuk `postgres`, `admin_crm`, `fachri`) dibuat dengan password yang sama. Kalau seeder ini pernah jalan di DB produksi, **setiap akun bisa dibuka dengan `password`**. Password `min:6` juga terlalu lemah.

**Perbaikan:** seeder hanya untuk lokal (`if (app()->environment('local'))`), password acak via `Str::password(16)`, dan rotasi kredensial produksi.

---

### SEC-09 — Rate limiter login mudah di-bypass (SEDANG)

**Bukti:** 12 attempt dari IP sama → attempt 1–5 diproses (~260–300 ms, jalur bcrypt), attempt 6–12 **62–78 ms** (ditolak murah). Limiter **bekerja** (5/menit, trip tepat di hit ke-5). Namun:
- key = `strtolower(username).'|'.$ip` → ganti username = limit baru;
- hanya ada satu layer (tidak ada blokir IP jangka panjang);
- tidak ada `X-Forwarded-For` handling → di belakang Cloudflare **semua user berbagi IP** sehingga satu penyerang bisa mengunci semua user (DoS pada login).

**Perbaikan:** limiter dua kunci (`username|ip` **dan** `ip`), tambah `RateLimiter::hit($ipKey, 3600)` dengan ambang lebih tinggi, dan pasang `TrustProxies` yang benar agar `$request->ip()` mengembalikan IP klien asli.

---

### SEC-10 — CSRF tidak dapat dikirim non-admin karena rotasi sesi (SEDANG — sisi positif)

Terukur: `session()->regenerate()` di `AuthController::login()` merotasi token, jadi token pra-login selalu **419**. Ini benar secara keamanan, tetapi berarti:
- non-admin **tidak punya** halaman ber-form untuk mendapat token segar → semua POST mereka 302 (ditolak middleware) sebelum validasi apa pun;
- **efek samping**: setiap user yang membuka aplikasi di dua tab dan login di salah satunya akan kena 419 tanpa penjelasan.

Tidak perlu diperbaiki untuk keamanan; catat sebagai perilaku.

---

### SEC-11 — Parameter `cql_filter` diteruskan bebas ke GeoServer (SEDANG)

Frontend membangun CQL dari input user dengan interpolasi string:
```js
conditions.push(`bacameter_namacater LIKE '%${caterValue.toUpperCase()}%'`);
conditions.push(`nolang LIKE '${formattedRayon}%'`);
```
(`resources/js/gis/filters.js`, `search.js`). Nilainya diteruskan mentah lewat proxy. Terukur: `cql_filter=nama IS NOT NULL` → HTTP 200. GeoServer punya WFS-T/`strToLowerCase` dan CQL bukan SQL murni, tapi ini permukaan injeksi query yang tidak divalidasi.

**Bukti positif:** filter dropdown memakai nilai tetap (status/tarif/kubikasi divalidasi `split('-')` & numerik), jadi jalur dropdown aman. Yang perlu diperbaiki hanya dua input bebas teks.

**Perbaikan:** escape `'` → `''` di server (proxy), dan validasi panjang + charset (`^[A-Za-z0-9 .-]{1,50}$`) di klien.

---

### SEC-12 — Link "Ingat saya" & "Lupa Password?" tidak berfungsi (RENDAH, tapi menyesatkan)

**Terukur:** login dengan `remember=on` → cookie hanya `['XSRF-TOKEN', 'laravel_session']`, **tidak ada** `remember_web_*`. Checkbox "Ingat saya" tidak terkirim ke server (`Auth::attempt($credentials)` tanpa argumen kedua). "Lupa Password?" `href="#"`, dan `/password/reset`, `/forgot-password` → **404**. Ini fitur keamanan yang terlihat ada tapi tidak ada.

---

## 2. TEMUAN TAMPILAN (UI/UX + AKSESIBILITAS)

Metode: Chrome headless via CDP, diukur `getBoundingClientRect()` / `getComputedStyle()`, bukan dibaca dari kelas CSS.

| ID | Halaman | Hasil terukur |
|----|---------|---------------|
| F1 | `/login`, `/dashboard`, `/settings/users`, `/settings/roles` @ 764 px | `scrollWidth == innerWidth` di 4/4 → **tidak ada overflow** ✅ |
| F2 | `/dashboard` @ 390×844 | `scrollWidth 390 == innerWidth 390` → **tidak ada overflow** ✅ |
| F3 | Sidebar mobile | sidebar `left < 0` (off-canvas), lebar 288 px, `#sidebarToggle` terlihat & ≥0 → **berfungsi** ✅ |
| F4 | Peta | `#map` 764×381 px (desktop), 390×740 px (mobile) → **mengisi** ✅ |
| F5 | Tombol ikon | `/settings/users` **35 tombol tanpa teks & tanpa `aria-label`**; `/settings/roles` **47**; `/dashboard` 5 → **52 kontrol tanpa nama aksesibel** ❌ |
| F6 | Kontrol interaktif | accordion sidebar ✅, dropdown profil ✅, toggle basemap `Satelit→Peta` ✅, 41 checkbox layer ter-render ✅ |
| F7 | Heading | `/login` 1×`<h1>`, `/dashboard` 1×`<h1>`, admin 2×`<h1>` (logo + judul) — **judul logo seharusnya bukan h1** ❌ |
| F8 | Admin tanpa peta | `/settings/users` tetap memuat Leaflet js+css (0 penggunaan) → **~150 KB terbuang** ❌ |

**Akibat nyata SEC/F5:** tombol edit & hapus di tabel hanya muncul saat `group-hover` (`opacity-0 group-hover:opacity-100`) — **tidak dapat diakses keyboard atau layar sentuh**. Di ponsel, tombol edit/hapus user tidak pernah muncul.

**Akibat F8 + performa:** halaman admin memuat `leaflet.js`, `leaflet.css`, dan jQuery penuh padahal tidak ada peta — 3 pustaka tanpa fungsi.

**Desain:** sistem visual konsisten (token `bg-glass`, `shadow-premium`, skala tipografi `text-[8px]`–`text-2xl` dipakai seragam), tetapi memakai **~11 ukuran teks arbitrer** (`text-[8px]` … `text-[11px]`) alih-alih token — rapuh, sulit dirawat.

---

## 3. TEMUAN PERFORMA & KESEHATAN SISTEM

### Terukur (cold, lokal)

| Metrik | `/login` | `/dashboard` |
|--------|----------|--------------|
| TTFB | 43 ms | 46 ms |
| First Contentful Paint | 552 ms | 100 ms* |
| DOMContentLoaded | 399 ms | 87 ms |
| Byte transfer | 1,2 KB** | 120 KB** |
| Ukuran bundle | – | CSS 58 KB + JS 61 KB (gzip 10 + 22 KB) |

\* dashboard sudah hangat (bundle ter-cache). \*\* byte CDN dilaporkan 0 karena cross-origin tanpa `Timing-Allow-Origin` — angka sebenarnya lebih besar.

### Kesehatan

| ID | Temuan | Bukti |
|----|--------|-------|
| E3 | **7 aset pihak ketiga, 3 CDN berbeda** | `cdn.tailwindcss.com`, `cdnjs.cloudflare.com` ×3, `fonts.googleapis.com`, `cdn-icons-png.flaticon.com` ×3, `mt1.google.com` (tiles) |
| E3a | `/login` memakai **Tailwind Play CDN** (`cdn.tailwindcss.com`) | compiler JIT ~400 KB di browser, **tidak untuk produksi** (Tailwind sendiri melarang). Juga `@vite` tidak dipakai di halaman login → bundle Vite tidak dimuat di sana |
| E4 | Seeder user lambat | `UserSeeder` **26.054 ms** untuk 126 user = **~207 ms/user** (bcrypt cost 12) — kalau dijalankan di migrasi produksi, deploy menggantung 26 detik |
| E5 | **44 advisory CVE di 12 paket** | lihat bawah |
| – | Aset dari CDN tanpa SRI | tidak ada atribut `integrity` |
| – | `*{transition: all 0.2s}` global | `resources/css/app.css` transisi pada **setiap** elemen → repaint mahal saat peta bergerak |

**CVE per paket (composer audit):**
```
laravel/framework        5 advisories (critical,high,medium,low)
league/commonmark       12 advisories (high,medium)
guzzlehttp/guzzle        9 advisories (high,medium)
guzzlehttp/psr7          4 advisories (medium)
symfony/yaml             4 advisories (high,low)
symfony/routing          2 advisories (medium)
symfony/http-foundation  2 advisories (high,medium)
symfony/mime             2 advisories (medium,high)
symfony/http-kernel      1 advisory  (high)
symfony/mailer           1 advisory  (medium)
league/flysystem         1 advisory  (low)
symfony/polyfill-intl-idn 1 advisory (low)
```
**Aksi:** `composer update laravel/framework guzzlehttp/* league/commonmark symfony/*` lalu `composer audit` sampai 0.

**Upstream GeoServer** membatasi memori sendiri (bagus): `GetMap 20000×20000` → `ServiceException MaxMemoryExceeded: would use 1562500KB, max 65536KB`. Jadi DoS lewat ukuran gambar **tidak** tembus. Yang tembus justru kebocoran data (SEC-01).

---

## 4. TEMUAN KODE & STRUKTUR

**Yang baik:** pemisahan jelas (`Controllers / Middleware / Models / Auth`), frontend modular (12 modul ES6 di `resources/js/gis/`, 1.727 LOC), penamaan konsisten, `sanitizeHTML()` dipakai di `popupUI.js` (XSS Leaflet-popup tercegah — diverifikasi: semua properti di-escape sebelum masuk template), validasi sort kolom mencegah SQLi:
```php
if (!in_array($sortBy, ['name','username','created_at'])) $sortBy = 'name';
```
✅ Ini benar dan layak dipertahankan.

| ID | Temuan | Bukti |
|----|--------|-------|
| QUA-01 | **`eventManager.js` 220 LOC, 0 import** | `grep -r eventManager` → hanya didefinisikan, tidak pernah dipakai. 8,7% frontend mati |
| QUA-02 | **`setupMapZoomHandler()` tak pernah dipanggil** | didefinisikan di `map.js`, `initMap` tidak memanggilnya → seluruh logika peringatan zoom-level tidak aktif |
| QUA-03 | **`DatabaseUser`/`PgsqlUserProvider` mati** | `config/auth.php` hanya mendaftarkan driver `eloquent`; `Auth::provider('pgsql')` didaftarkan tapi tidak dipakai guard mana pun → **jalur login produksi yang sebenarnya tidak aktif**, sementara kode berisi hardcoded IP + password di session tetap ter-commit |
| QUA-04 | **`role.permissions`: 0 pembaca** | kolom JSON dibuat, UI-nya ada di `/settings/roles`, tapi tidak ada `->permissions` yang menggerbang akses |
| QUA-05 | **Admin controller tanpa test** | `tests/` hanya `ExampleTest` ×2 (`assertTrue(true)`). 0 test untuk 17 route, 0 untuk otorisasi |
| QUA-06 | **Logika hapus terduplikasi** | whitelist username di 3 tempat (middleware, controller, blade) — ubah satu, dua lainnya basi |
| QUA-07 | **`GeoServerProxyController` = 60 LOC tanpa abstraksi** | campur: resolusi URL, HTTP, error handling, logging PII (`'params' => $request->query()` menulis koordinat & filter ke log) |
| QUA-08 | **Nomor telepon/tanggal format manual** | format tanggal Indonesia diduplikasi di `helpers.js` & `popupUI.js` |
| QUA-09 | **`config/gis.php` fallback IP publik** | `env('GIS_GEOSERVER_URL', 'http://36.93.220.245:8080/...')` — kalau env hilang, aplikasi diam-diam menembak IP produksi |

**Struktur file:** 12 modul JS untuk 1 peta = wajar. Tapi `filters.js` mencampur 3 domain (pelanggan, pipa, pengaduan) dalam satu file 304 LOC dengan fungsi 100+ LOC masing-masing → pecah per domain.

---

## 5. TEMUAN FUNGSI & ATURAN BISNIS

| ID | Skenario | Hasil terukur | Status |
|----|----------|---------------|--------|
| G1 | Filter pelanggan → CQL | `statusFilter`, `cabangFilter`, `tarifFilter`, `kubikasi`, `tunggakan`, `umurWM` → string CQL valid, debounce 300 ms | ✅ |
| G2 | Filter pipa | tanpa pilihan → layer dihapus dari peta (`map.removeLayer`); dengan pilihan → `cql_filter` gabungan + `tiled:false` | ✅ |
| G3 | Cari pelanggan | `GetFeature` `maxFeatures:10` + `strToUpperCase(nama)`, zoom 18, marker + popup | ✅ |
| G4 | Klik peta | GetFeatureInfo berurutan sesuai prioritas (aksesoris → pipa → pengaduan → pelanggan) | ✅ |
| G5 | Hapus role yang masih dipakai | HTTP 200, **"Role tidak dapat dihapus karena masih digunakan oleh user."** | ✅ |
| G6 | **Hapus diri sendiri** | HTTP 200, akun `fachri` **benar-benar terhapus** dari DB (125 user tersisa) | ❌ **BUG** |
| G7 | Permission mengekang akses | `role.permissions` 0 pembaca di kode | ❌ |
| G8 | "Ingat saya" | cookie tanpa `remember_web_*` → checkbox tak berpengaruh | ❌ |
| G9 | "Lupa Password?" | `href="#"`, 3 route reset → 404 | ❌ |
| G10 | "Profil Saya" | `href="#"` → tak ada halaman | ❌ |

**G6 detail:** `UserController::destroy()` berkomentar `// Avoid self-deletion if needed, but for now simple delete` — dan memang belum diimplementasikan. `bulkDestroy()` sudah melindungi diri sendiri + 3 username, tetapi `destroy()` tunggal **tidak**. Ini inkonsistensi aturan bisnis: jalur massal aman, jalur satuan tidak.

**Celah aturan bisnis lain:**
- Admin bisa menurunkan role admin terakhir → sistem terkunci tanpa admin.
- Tidak ada audit trail: siapa menghapus siapa, kapan, tidak tercatat.
- `User::update()` memperbolehkan ubah `role_id` milik user lain tanpa batas — termasuk mencabut akses admin lain.

---

## 6. DAFTAR PRIORITAS

### P0 — sebelum produksi (wajib)
1. **SEC-01** batasi parameter WFS: `maxFeatures`, whitelist `propertyName` → hentikan kebocoran 44,6 MB.
2. **SEC-02** hapus `session(['pgsql_pass'])`.
3. **SEC-03** ganti verifikasi login; **tutup port 9191** dari internet.
4. **SEC-07** pasang header keamanan (CSP + X-Frame-Options minimal).
5. **SEC-08** hapus `Hash::make('password')` dari seeder; rotasi kredensial.
6. **E5** `composer update` sampai `composer audit` = 0 (5 advisory kritis di Laravel framework).
7. **G6** tolak `destroy()` bila `$user->id === auth()->id()`.

### P1 — sprint berikut
8. **SEC-04** `verify => true`.
9. **SEC-05** jangan kirim `$e->getMessage()` ke klien.
10. **SEC-06** otorisasi berbasis role/permission, hapus whitelist username ×3.
11. **SEC-09** limiter dua kunci + `TrustProxies`.
12. **SEC-11** escape `cql_filter` di server.
13. **F5** `aria-label` pada 52 tombol ikon; buat tombol aksi tabel selalu terlihat (bukan `group-hover`).
14. **QUA-05** tulis test: otorisasi per-role, CRUD user/role, proteksi self-delete.

### P2 — perbaikan bertahap
15. **E3a** buang `cdn.tailwindcss.com` dari `/login`, pakai bundle Vite.
16. **F8** keluarkan Leaflet/jQuery dari layout admin (layout terpisah atau `@stack`).
17. **QUA-01/02/03** hapus 220 LOC `eventManager`, aktifkan atau hapus `setupMapZoomHandler`, hapus `PgsqlUserProvider` yang mati.
18. **G8/G9/G10** implementasi atau hapus "Ingat saya", "Lupa Password", "Profil Saya".
19. **F7** turunkan `<h1>` logo menjadi `<p>`/`<span>`.
20. **E4** seeder pakai `bcrypt rounds` rendah khusus lokal.
21. **CSS** ganti `*{transition}` global dengan daftar properti eksplisit.
22. **QUA-07/09** pindahkan `config/gis.php` fallback IP ke `.env` wajib (tanpa default publik).

---

## 7. LAMPIRAN — cara reproduksi

```bash
# setup
cd D:/Projects/webgisupdate
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm install && npm run build
php artisan serve --host=127.0.0.1 --port=8123
```

```bash
# SEC-01 kebocoran data
curl -s -b cookies.txt \
  "http://127.0.0.1:8123/geo-proxy?service=WFS&version=1.0.0&request=GetFeature&typeName=webgis:analisa_pelanggan&outputFormat=application/json" \
  -o dump.json && ls -lh dump.json     # → 43M

# SEC-07 header
curl -sD - -o /dev/null http://127.0.0.1:8123/login | grep -iE 'x-frame|content-security|x-content-type'

# SEC-09 rate limit
python qa/probe_auth.py          # 12 percobaan, latensi drop di attempt 6

# SEC-06 otorisasi non-admin
python qa/probe_eskalasi.py      # semua 302 → /dashboard

# G6 self-delete
python qa/probe_bisnis.py        # "G6 hapus diri sendiri -> HTTP 200"

# E5 CVE
composer audit --format=summary  # 44 advisories / 12 packages
```

**Skrip uji tersimpan di `qa/`:** `probe_auth.py`, `probe_eskalasi.py`, `probe_geoproxy.py`, `probe_geoproxy_auth.py`, `probe_bisnis.py`, `ui_audit.py`, `cdp.py`.

---

## 8. Catatan kejujuran cakupan

- Diuji di **SQLite dev**, bukan PostgreSQL produksi. Jalur `PgsqlUserProvider` (SEC-02/03) **tidak menyala** di lingkungan ini — temuannya berbasis bacaan kode + verifikasi bahwa driver tidak terdaftar di `config/auth.php`, bukan eksekusi login nyata lewat pgsql.
- Load test konkurensi (10.000 user) **tidak dijalankan**: `php artisan serve` adalah satu proses dan tidak mencerminkan produksi. Yang dilaporkan hanya TTFB per-request dan ukuran aset.
- Audit aksesibilitas memakai pengukuran DOM (label/heading/overflow), **bukan** axe-core penuh — rasio kontras WCAG belum diukur.
- `composer audit` dijalankan terhadap lockfile yang di-commit; advisories mencerminkan versi terkunci, bukan hasil `composer update`.
