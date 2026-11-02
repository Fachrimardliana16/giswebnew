# RENCANA: CMS Layer GeoServer

**Tujuan:** admin memasukkan URL WMS GeoServer → sistem mendeteksi layer secara
otomatis → admin memilih layer → layer muncul di panel peta tanpa perlu deploy
kode.

**Kondisi sekarang:** 17 layer di-hardcode di `resources/js/gis/layers.js`.
Menambah layer = edit kode + `npm run build` + deploy. Ini yang ingin dihilangkan.

---

## 1. Alur pengguna

```
Admin buka /settings/layers
        │
        ├── [Tambah Sumber]
        │      isi: Nama sumber, URL WMS
        │            (mis. http://36.93.220.245:8080/geoserver/webgis/wms)
        │      sistem: uji koneksi → GetCapabilities → simpan
        │
        ├── [Deteksi Layer]
        │      sistem parse GetCapabilities → daftar layer + judul + SRS
        │      admin centang layer yang ingin dipakai
        │      atur per layer: nama tampilan, grup menu, minZoom, urutan
        │
        └── [Simpan] → layer langsung muncul di peta (tanpa deploy)
```

---

## 2. Skema database

### `geoserver_sources`
| kolom | tipe | catatan |
|---|---|---|
| id | bigint | |
| nama | string | mis. "PDAM Purbalingga" |
| url_wms | text | URL GetMap |
| url_wfs | text nullable | untuk pencarian & atribut |
| username / password | text nullable | bila GeoServer butuh auth (di-encrypt) |
| verify_tls | boolean | default true |
| aktif | boolean | |
| terakhir_dicek | timestamp | |
| status_koneksi | string | `ok` / `gagal` / `belum` |
| pesan_error | text nullable | |
| timestamps | | |

### `geoserver_layers`
| kolom | tipe | catatan |
|---|---|---|
| id | bigint | |
| source_id | FK → geoserver_sources | cascade delete |
| nama_layer | string | `webgis:analisa_pelanggan` (dari GeoServer) |
| nama_tampilan | string | label di UI |
| judul_geoserver | string nullable | dari `<Title>` |
| grup | string | `pelanggan` / `pengaduan` / `jaringan` / `aksesoris` |
| min_zoom / max_zoom | unsignedTinyInteger | default 12 / 22 |
| urutan | integer | urutan di sidebar |
| tipe | string | `point` / `line` / `polygon` (dari geometri) |
| atribut_label | string nullable | kolom untuk judul popup, mis. `nama` |
| atribut_nolang | string nullable | kolom nomor langganan |
| kolom_tampil | json nullable | whitelist kolom popup |
| cql_default | text nullable | filter bawaan |
| aktif | boolean | tampil/tidak di peta |
| **unik** | (source_id, nama_layer) | |

> Tabel `geoserver_layers` menggantikan isi `LAYER_ZOOM_LEVELS` +
> `config/gis.php` aksesoris. Konfigurasi pindah dari kode ke database.

---

## 3. Endpoint

Semua di bawah middleware `auth` + `admin.access`.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/settings/layers` | daftar sumber + layer |
| POST | `/settings/layers/sources` | tambah sumber |
| PUT | `/settings/layers/sources/{id}` | ubah sumber |
| DELETE | `/settings/layers/sources/{id}` | hapus sumber (+ layer-nya) |
| POST | `/settings/layers/sources/{id}/uji` | **uji koneksi** (tombol "Tes") |
| POST | `/settings/layers/sources/{id}/deteksi` | **parse GetCapabilities** → simpan layer baru |
| PUT | `/settings/layers/{id}` | atur nama tampilan / grup / zoom / urutan |
| POST | `/settings/layers/{id}/toggle` | aktif/nonaktif |
| DELETE | `/settings/layers/{id}` | hapus layer |
| GET | `/api/peta/layer` | **JSON untuk frontend** (dipakai panel peta) |

---

## 4. Cara deteksi otomatis

### Langkah 1 — Ambil GetCapabilities
```
GET {url_wms}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities
```

### Langkah 2 — Parse XML
Ambil per `<Layer>` yang punya `<Name>`:
- `Name` → `nama_layer` (mis. `webgis:web_pipa`)
- `Title` → `judul_geoserver`
- `<SRS>` / `<CRS>` → pastikan mendukung `EPSG:4326`
- `queryable="1"` → bisa diklik (GetFeatureInfo)
- `MaxScaleDenominator` → turunkan `min_zoom` kasar

### Langkah 3 — Tebak tipe geometri & atribut
Lewat WFS `DescribeFeatureType`:
```
GET {url_wfs}?service=WFS&request=DescribeFeatureType&typeName=webgis:web_pipa
```
- Elemen `gml:PointPropertyType` → `point`
- Kolom bernama `nama`/`nolang` → isi `atribut_label` / `atribut_nolang`
- Sisanya masuk `kolom_tampil` (dibatasi 20 kolom)

Kalau WFS tidak tersedia, tipe dibiarkan `null` dan admin memilih manual.

### Langkah 4 — Uji render
Ambil 1 tile contoh 256×256:
```
GetMap&LAYERS={layer}&BBOX=...&WIDTH=256&HEIGHT=256
```
- `image/png` → **OK**
- `ServiceException LayerNotDefined` → layer rusak, beri tanda merah di UI

---

## 5. Perubahan frontend

### Panel peta
`layers.js` sekarang hardcode 17 layer. Jadi:
- Saat load, `GET /api/peta/layer` → terima daftar layer aktif
- `createWMSLayer()` dipanggil **lazy** saat checkbox dicentang (sekaligus
  memenuhi optimasi d: lazy-load)
- `LAYER_ZOOM_LEVELS` dibaca dari respons API, bukan konstanta

### Sidebar
Dirender dari data, bukan Blade statis. Grup (Pelanggan/Pengaduan/Jaringan/
Aksesoris) tetap sama supaya bottom nav tidak berubah.

### Popup
`atribut_label` dan `kolom_tampil` menentukan judul & baris popup — jadi layer
baru otomatis dapat popup yang rapi tanpa menyentuh `popupUI.js`.

---

## 6. Keamanan (ini bagian paling rawan)

**Masalah:** admin memasukkan URL bebas → server akan melakukan request ke URL
itu = **SSRF**. Bisa dipakai menembak `http://169.254.169.254/` (metadata cloud),
`http://localhost:5432`, atau IP internal.

**Mitigasi wajib:**
1. **Validasi skema** — hanya `http` / `https`. Tolak `file://`, `gopher://`,
   `dict://`.
2. **Blokir IP privat/loopback/link-local** setelah resolve DNS:
   `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`
   — kecuali IP itu memang terdaftar di allowlist `.env`.
3. **Allowlist opsional** di `.env`:
   `GEOSERVER_ALLOWED_HOSTS=36.93.220.245`
4. **Timeout + batas ukuran respons** saat ambil GetCapabilities (mis. 10 detik,
   5 MB) — cegah server dijadikan alat DoS.
5. **Redirect dimatikan** atau divalidasi ulang tiap hop.
6. **Semua request lewat proxy Laravel** (`/geo-proxy`), GeoServer tidak pernah
   dipanggil langsung dari browser — sudah diterapkan sekarang, dipertahankan.

Kalau poin 1–2 tidak dikerjakan, fitur ini **tidak boleh dirilis** — itu jalan
masuk ke jaringan internal.

---

## 7. Rencana kerja (perkiraan)

| # | Pekerjaan | Beban | Hasil |
|---|---|---|---|
| 1 | Migrasi + model + seeder sumber awal | sedang | tabel siap |
| 2 | `GeoserverDiscoveryService` (uji koneksi, parse Capabilities, DescribeFeatureType, uji tile) | **besar** | inti fitur |
| 3 | Validator URL aman (blokir IP privat) | sedang | syarat rilis |
| 4 | Controller + route + form admin (Blade) | besar | UI admin |
| 5 | Endpoint `/api/peta/layer` + frontend baca dari API | sedang | layer tampil |
| 6 | Sidebar & popup dirender dari data | sedang | tanpa ubah kode |
| 7 | Test: discovery, validasi SSRF, CRUD, render layer | sedang | terkunci |
| 8 | Migrasi 17 layer lama ke DB (seeder) | kecil | tidak ada yang hilang |

**Yang perlu diputuskan sebelum mulai:**

1. **Satu sumber atau banyak?** Saya sarankan tabel sumber mendukung banyak
   (agar nanti bisa tambah GeoServer cabang lain), tapi UI awal cukup satu.
2. **Siapa yang boleh ubah?** Semua admin, atau perlu permission khusus
   (`kelola_layer`) supaya tidak semua admin bisa mengubah peta?
3. **Kalau GeoServer mati saat aplikasi dipakai** — layer lama tetap tampil
   (pakai cache konfigurasi) atau hilang? Saya sarankan tetap tampil dengan
   tanda "tidak tersedia".
4. **Auto-deteksi semua layer saat pertama tambah, atau admin pilih manual?**
   Saya sarankan deteksi semua lalu admin mencentang — lebih aman.

---

## 8. Yang sengaja TIDAK termasuk

- Upload data spasial (shapefile/GeoJSON) langsung ke aplikasi — itu fitur
  berbeda dan jauh lebih besar.
- Edit gaya/SLD dari aplikasi — biarkan di GeoServer.
- Layer dari sumber non-WMS (mis. ArcGIS REST, Mapbox) — bisa nanti, tapi
  desainnya beda.
