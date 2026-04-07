# GIS Web New - Advanced WebGIS Platform

Aplikasi WebGIS modern yang dirancang untuk manajemen jaringan pipa, data pelanggan, dan monitoring pengaduan secara real-time. Dibangun dengan fokus pada performa tinggi, interaktivitas presisi, dan estetika premium.

## 🚀 Fitur Unggulan

### 1. Kontrol Layer Interaktif
- **Manajemen Jaringan Pipa**: Visualisasi pipa berdasarkan diameter (Ø 15mm - 400mm) dengan kontrol toggle yang responsif.
- **Aset Teknis**: Layer khusus untuk Reservoar, Mata Air (MA), dan berbagai aksesoris jaringan (Valve, Hydrant, dll).
- **Data Pelanggan**: Pemetaan titik pelanggan dengan status aktif/pasif yang jelas.

### 2. Sistem Filtrasi Analitis (Advanced Filtering)
- **Filter Pelanggan**: Berdasarkan kantor cabang, status pelanggan, rentang kubikasi pemakaian, jumlah tunggakan, dan golongan tarif (Kode 1-17).
- **Filter Jaringan Pipa**: Sinkronisasi global berdasarkan Material (PVC, HDPE, dll), Jenis Jaringan (Transmisi/Distribusi), dan Wilayah Unit/IKK.
- **Monitoring Pengaduan**: Analisis data pengaduan berdasarkan tahun laporan dan status pengerjaan.

### 3. Interaktivitas Presisi (Smart Query)
- **Feature Info Prioritization**: Sistem cerdas yang memprioritaskan aset teknis (pipa/aksesoris) saat diklik di peta, memastikan kemudahan akses data meskipun di area padat pelanggan.
- **Popup UI Premium**: Informasi detail aset dengan tampilan bersih, tabel data yang mudah dibaca, dan integrasi langsung ke Google Maps untuk navigasi lapangan.

### 4. Pencarian Cepat
- Dukungan pencarian cepat untuk Data Pelanggan, Kode Rayon, dan Nama Petugas Cater.

## 🛠️ Teknologi yang Digunakan

- **Backend**: Laravel 11 (PHP 8.2+)
- **Frontend**: Leaflet.js, Tailwind CSS, Vanilla CSS (Glassmorphism Design)
- **Map Server**: GeoServer (WMS & CQL Filtering)
- **Build Tool**: Vite

## 📦 Instalasi

1. **Clone Repositori**
   ```bash
   git clone https://github.com/Fachrimardliana16/giswebnew.git
   cd giswebnew
   ```

2. **Instalasi Dependensi**
   ```bash
   composer install
   npm install
   ```

3. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi database serta URL GeoServer Anda.
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Kompilasi Aset & Jalankan Server**
   ```bash
   npm run dev
   # Di terminal terpisah
   php artisan serve
   ```

## 📝 Lisensi

Proyek ini dikembangkan untuk kebutuhan internal manajemen GIS. Seluruh hak cipta dilindungi.
