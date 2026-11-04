@php
$rayons = include config_path('rayons.php');
if (!is_array($rayons)) $rayons = [];
$pipeSizes = config('gis.pipe_sizes', []);
$accessories = config('gis.accessories', []);
@endphp

<aside id="sidebar" class="sidebar-sheet bg-glass border-r border-white/20 flex flex-col z-[60] -translate-x-full md:translate-x-0 md:relative transition-all duration-500 ease-in-out shadow-premium">
    {{-- Header sheet (mobile): judul + tombol tutup yang jelas.
         Gagang tetap ada untuk drag, tapi sekarang punya label dan close. --}}
    <div class="sidebar-sheet__handle" data-sheet-handle>
        <span class="sidebar-sheet__grip" aria-hidden="true"></span>
    </div>
    <div class="sidebar-sheet__head">
        <div class="sidebar-sheet__head-text">
            <h2 class="sidebar-sheet__title" id="sheetTitle">Layer</h2>
            <p class="sidebar-sheet__subtitle" id="sheetSubtitle">Pilih data yang ingin ditampilkan</p>
        </div>
        <button type="button" class="sidebar-sheet__close" data-sheet-close
                aria-label="Tutup panel" title="Tutup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M7 7l10 10M17 7L7 17"></path>
            </svg>
        </button>
    </div>
    <div class="sidebar-sheet__head-line" aria-hidden="true"></div>

    <div class="sidebar-sheet__isi flex-grow overflow-y-auto px-4 py-8 custom-scrollbar">

        <div class="px-2 mb-4 mt-4">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                LAYER MASTER CONTROL
            </h2>
        </div>
        
        <div class="layer-control space-y-3">
            {{-- Pelanggan Section --}}
            <x-gis.sidebar.section title="DATA PELANGGAN" id="pelanggan" :open="true">
                <div class="pb-1">
                    <x-gis.sidebar.layer-checkbox id="analisa_pelanggan" label="Analisa Pelanggan" class="pelanggan-checkbox" />
                </div>
                
                <div class="space-y-5 pt-5 pb-2 px-2 border-t border-slate-100/50 mt-2">
                    <x-gis.sidebar.filter-select id="cabangFilter" label="Kantor Cabang Terkait">
                        <option value="">Semua Wilayah Cabang</option>
                        {{-- NILAI HARUS SAMA PERSIS DENGAN ISI KOLOM `cabang`.
                             Sebelumnya semua opsi diberi awalan "Cabang ",
                             padahal di data hanya kantor cabang yang berawalan
                             "Cabang ". Unit IKK tersimpan TANPA awalan:
                               'Unit IKK Rembang', 'Unit IKK Bukateja',
                               'Unit IKK Kemangkon'
                             Akibatnya memilih unit IKK mengirim
                               cabang='Cabang Unit IKK Rembang'
                             yang tidak ada di data -> filter tidak cocok,
                             peta tidak bergeser, dan tidak ada data tampil.
                             Jumlah baris tiap nilai diambil dari data asli. --}}
                        @foreach([
                            'Cabang Kota Bangga' => 22066,
                            'Cabang Jenderal Soedirman' => 14557,
                            'Cabang Ardilawet' => 8935,
                            'Cabang Usman Janatin' => 7136,
                            'Cabang Goentoer Djarjono' => 6086,
                            'Unit IKK Kemangkon' => 3992,
                            'Unit IKK Bukateja' => 1096,
                            'Unit IKK Rembang' => 1035,
                        ] as $cabang => $jumlah)
                            <option value="{{ $cabang }}">{{ $cabang }} ({{ number_format($jumlah, 0, ',', '.') }})</option>
                        @endforeach
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="statusFilter" label="Status Pelanggan Sekarang">
                        <option value="">Semua Status Aktif/Pasif</option>
                        <option value="1">Baru (SR)</option>
                        <option value="2">Aktif Normal</option>
                        <option value="3">Tutup Sementara</option>
                        <option value="4">Tutup Permanen</option>
                        <option value="5">Bongkar Segel</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="kubikasiFilter" label="Berdasarkan Kubikasi (m³)">
                        <option value="">Semua Pemakaian</option>
                        <option value="0">Tepat 0 m³</option>
                        <option value="1-10">Antara 1 - 10 m³</option>
                        <option value="11-20">Antara 11 - 20 m³</option>
                        <option value="21-30">Antara 21 - 30 m³</option>
                        <option value=">30">Lebih dari 30 m³</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="tunggakanFilter" label="Berdasarkan Lembar Tunggu">
                        <option value="">Semua Tunggakan</option>
                        <option value="2">Menunggak 2 Bulan</option>
                        <option value="3">Menunggak 3 Bulan</option>
                        <option value="4">Menunggak 4 Bulan</option>
                        <option value="5">Menunggak 5 Bulan</option>
                        <option value="6">Menunggak 6 Bulan</option>
                        <option value="7">Menunggak 7 Bulan</option>
                        <option value=">7">Lebih dari 7 Bulan</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="tarifFilter" label="Berdasarkan Tarif">
                        <option value="">Semua Tarif</option>
                        <option value="1">1 - ABRI/TNI POLRI</option>
                        <option value="2">2 - TNI Yonif 406 CK</option>
                        <option value="3">3 - Industri Kecil</option>
                        <option value="4">4 - Industri Besar</option>
                        <option value="5">5 - Inst. Pemerintah</option>
                        <option value="6">6 - Niaga Kecil</option>
                        <option value="7">7 - Niaga Besar</option>
                        <option value="8">8 - Rumah Tangga A</option>
                        <option value="9">9 - Rumah Tangga B</option>
                        <option value="10">10 - Rumah Tangga C</option>
                        <option value="11">11 - Sosial Umum</option>
                        <option value="12">12 - Sosial Khusus</option>
                        <option value="13">13 - RT Serang</option>
                        <option value="14">14 - Sosial Umum KRJ</option>
                        <option value="15">15 - RT Kutabawa</option>
                        <option value="16">16 - RT KRETE</option>
                        <option value="17">17 - RT Khusus</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="umurWMFilter" label="Berdasarkan Umur WM (Tahun)">
                        <option value="">Semua Umur WM</option>
                        <option value="none">Tidak Diketahui / 0 Tahun</option>
                        <option value="0">Tepat 0 Tahun</option>
                        <option value="1-5">Antara 1 - 5 Tahun</option>
                        <option value="6-10">Antara 6 - 10 Tahun</option>
                        <option value="11-20">Antara 11 - 20 Tahun</option>
                        <option value="21-30">Antara 21 - 30 Tahun</option>
                    </x-gis.sidebar.filter-select>

                    {{-- --- FITUR BARU: isValid + status pelunasan --- --}}
                    <x-gis.sidebar.filter-select id="isvalidFilter" label="Validitas Data">
                        <option value="">Semua Data</option>
                        <option value="true">Valid</option>
                        <option value="false">Tidak Valid</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="lunasFilter" label="Status Pelunasan">
                        <option value="">Semua Pelanggan</option>
                        <option value="belum">Belum Lunas</option>
                        <option value="lunas">Sudah Lunas</option>
                    </x-gis.sidebar.filter-select>
                    {{-- --- AKHIR FITUR BARU --- --}}

                    <div class="space-y-2.5">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Filtrasi Nama Petugas Cater</label>
                        <div class="flex gap-2 group">
                            <input type="text" id="caterSearchInput" placeholder="Cari Nama Petugas..." class="flex-1 bg-slate-100/80 border border-slate-200/50 text-slate-700 text-[11px] font-black rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all">
                            <button id="applyCaterFilter" class="bg-emerald-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">CARI</button>
                        </div>
                    </div>

                    <div class="space-y-2.5">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Filtrasi Kontrol Rayon</label>
                        <div class="flex gap-2 group">
                            <input type="text" id="rayonSearchInput" placeholder="Kode Rayon..." class="flex-1 bg-slate-100/80 border border-slate-200/50 text-slate-700 text-[11px] font-black rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all">
                            <button id="applyRayonFilter" class="bg-blue-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">OK</button>
                        </div>
                    </div>
                </div>
            </x-gis.sidebar.section>

            {{-- Jaringan Pipa Section --}}
            <x-gis.sidebar.section title="JARINGAN PIPA" id="jaringan_pipa">
                <div class="space-y-4 mb-6 px-1">
                    <x-gis.sidebar.filter-select id="pipaJenisFilter" label="Berdasarkan Material">
                        <option value="">Semua Material</option>
                        <option value="PVC">Pipa PVC</option>
                        <option value="HDPE">Pipa HDPE</option>
                        <option value="GI">Pipa GI</option>
                        <option value="ACP">Pipa ACP</option>
                        <option value="DCIP">Pipa DCIP</option>
                        <option value="CI">Pipa CI</option>
                        <option value="Steel">Pipa Steel</option>
                        <option value="PE">Pipa PE</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="pipaJaringanFilter" label="Jenis Jaringan">
                        <option value="">Semua Jaringan</option>
                        <option value="JDU">JDU (Distribusi Utama)</option>
                        <option value="JDL">JDL (Distribusi Lingkungan)</option>
                        <option value="Tansmisi">Transmisi (Tansmisi)</option>
                        <option value="Tersier">Tersier/Lainnya</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="pipaUnitFilter" label="Wilayah Unit/IKK">
                        <option value="">Semua Unit</option>
                        <option value="Cabang Kota">Cabang Kota</option>
                        <option value="Cabang Kota Bangga">Cabang Kota Bangga</option>
                        <option value="Cabang Goentoer Djarjono">Cabang Goentoer Djarjono</option>
                        <hr class="my-1 border-white/10">
                        @foreach(['Bobotsari', 'Bojongsari', 'Bukateja', 'Kaligondang', 'Kalimanah', 'Kemangkon', 'Kutasari', 'Mrebet', 'Padamara', 'Rembang'] as $unit)
                            <option value="{{ $unit }}">{{ $unit }}</option>
                        @endforeach
                    </x-gis.sidebar.filter-select>
                </div>

                <div class="flex gap-2 mb-4 px-1">
                    <button id="selectAllPipa" class="flex-1 bg-blue-50 text-blue-600 text-[9px] font-black py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Pilih Semua</button>
                    <button id="uncheckAllPipa" class="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black py-2 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest">Hapus Semua</button>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <p class="text-[9px] font-black text-slate-400 mb-3 uppercase tracking-widest opacity-70">— FILTER DIAMETER PIPA</p>
                        <div class="grid grid-cols-2 gap-x-2 gap-y-3 px-1">
                            @foreach($pipeSizes as $size)
                                <x-gis.sidebar.layer-checkbox id="pipa{{ $size }}" label="Ø {{ $size }} mm" class="pipa-checkbox" />
                            @endforeach
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-100/50">
                        <p class="text-[9px] font-black text-slate-400 mb-3 uppercase tracking-widest opacity-70">— FILTER SUMBER AIR & RESERVOAR</p>
                        <div class="flex gap-2 mb-4 px-1">
                            <button id="selectAllSumberma" class="flex-1 bg-blue-50 text-blue-600 text-[9px] font-black py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Pilih Semua</button>
                            <button id="uncheckAllSumberma" class="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black py-2 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest">Hapus Semua</button>
                        </div>
                        <div class="space-y-4 px-1 mt-4">
                            <div>
                                <p class="text-[8px] font-black text-slate-400 mb-2 uppercase tracking-tighter opacity-60">RESERVOAR</p>
                                <div class="space-y-2">
                                    <x-gis.sidebar.layer-checkbox id="pipaReservoarMeri" label="Reservoar Meri" value="Reservoar Meri" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaReservoarWalik" label="Reservoar Walik" value="Reservoar Walik" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaReservoarKaranglewas" label="Reservoar Karanglewas" value="Reservoar Karanglewas" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaReservoarKaranggambas" label="Reservoar Karanggambas" value="Reservoar Karanggambas" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaReservoarBukateja" label="Reservoar Bukateja" value="Reservoar Bukateja" class="pipa-sumberma-checkbox" />
                                </div>
                            </div>
                            
                            <div>
                                <p class="text-[8px] font-black text-slate-400 mb-2 uppercase tracking-tighter opacity-60">MATA AIR (MA)</p>
                                <div class="space-y-2">
                                    <x-gis.sidebar.layer-checkbox id="pipaMALimbangan" label="MA Limbangan" value="MA Limbangan" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMAKajongan" label="MA Kajongan" value="MA Kajongan" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMAGombangan" label="MA Gombangan" value="MA Gombangan" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMASikopyah" label="MA Sikopyah" value="MA Sikopyah" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMATukArus" label="MA Tuk Arus" value="MA Tuk Arus" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMAWalik" label="MA Walik" value="MA Walik" class="pipa-sumberma-checkbox" />
                                    <x-gis.sidebar.layer-checkbox id="pipaMABataPutih" label="MA Bata Putih" value="MA Bata Putih" class="pipa-sumberma-checkbox" />
                                </div>
                            </div>

                            <div>
                                <p class="text-[8px] font-black text-slate-400 mb-2 uppercase tracking-tighter opacity-60">LAINNYA</p>
                                <div class="space-y-2">
                                    <x-gis.sidebar.layer-checkbox id="pipaCAKOTWalik" label="CAKOT Walik Kota 1" value="CAKOT WALIK KOTA 1" class="pipa-sumberma-checkbox" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </x-gis.sidebar.section>

            {{-- Aksesoris Section --}}
            <x-gis.sidebar.section title="AKSESORIS JARINGAN" id="aksesoris">
                <div class="flex gap-2 mb-4 px-1">
                    <button id="selectAllAksesoris" class="flex-1 bg-blue-50 text-blue-600 text-[9px] font-black py-2 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Pilih Semua</button>
                    <button id="uncheckAllAksesoris" class="flex-1 bg-slate-50 text-slate-400 text-[9px] font-black py-2 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest">Hapus Semua</button>
                </div>
                <div class="grid grid-cols-1 gap-2 px-1">
                    @foreach($accessories as $id => $label)
                        <x-gis.sidebar.layer-checkbox id="{{ $id }}" label="{{ $label }}" class="aksesoris-checkbox" />
                    @endforeach
                </div>

                {{-- --- FITUR BARU: filter bersama semua layer aksesoris --- --}}
                <div class="space-y-4 pt-5 mt-4 pb-2 px-2 border-t border-slate-100/50">
                    <x-gis.sidebar.filter-select id="aksesorisKondisiFilter" label="Kondisi Aset">
                        <option value="">Semua Kondisi</option>
                        <option value="baik">Baik / Bagus / Baru</option>
                        <option value="rusak">Rusak</option>
                        <option value="tertimbun">Tertimbun</option>
                        <option value="kosong">Belum Diisi</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="aksesorisDiameterFilter" label="Diameter (mm)">
                        <option value="">Semua Diameter</option>
                        <option value="25">25 mm</option>
                        <option value="40">40 mm</option>
                        <option value="50">50 mm</option>
                        <option value="75">75 mm</option>
                        <option value="100">100 mm</option>
                        <option value="150">150 mm</option>
                        <option value="200">200 mm</option>
                        <option value="250">250 mm</option>
                    </x-gis.sidebar.filter-select>

                    <x-gis.sidebar.filter-select id="aksesorisIsvalidFilter" label="Validitas Data">
                        <option value="">Semua Data</option>
                        <option value="true">Valid</option>
                        <option value="false">Tidak Valid</option>
                    </x-gis.sidebar.filter-select>
                </div>
                {{-- --- AKHIR FITUR BARU --- --}}
            </x-gis.sidebar.section>

            {{-- Monitoring Section --}}
            <x-gis.sidebar.section title="MONITORING LAINNYA" id="jaringan">
                <div class="space-y-4 py-3 px-2">
                    <x-gis.sidebar.layer-checkbox id="monitoring_pengaduan" label="Data Pengaduan Pelanggan" class="pengduan-checkbox" />
                    
                    <div class="pt-2 border-t border-slate-100 filter-pengaduan space-y-4">
                        <x-gis.sidebar.filter-select id="pengaduanTahunFilter" label="Cari Berdasarkan Tahun">
                            <option value="">Semua Tahun</option>
                            @foreach(range(date('Y'), 2020) as $year)
                                <option value="{{ $year }}">{{ $year }}</option>
                            @endforeach
                        </x-gis.sidebar.filter-select>

                        <x-gis.sidebar.filter-select id="statusPengaduanFilter" label="Status Laporan">
                            <option value="">Semua Status</option>
                            <option value="1">Laporan Masukan</option>
                            <option value="2">Diterima Admin</option>
                            <option value="3">Dalam Pengerjaan</option>
                            <option value="4">Selesai / Lunas</option>
                        </x-gis.sidebar.filter-select>
                    </div>
                </div>
            </x-gis.sidebar.section>

            @php
                $isSuperAdmin = auth()->check() && auth()->user()->isAdmin();
            @endphp

            @if($isSuperAdmin)
                {{-- Main Navigation for Admin --}}
                <div class="px-2 mb-6">
                    <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-4">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                        MAIN NAVIGATION
                    </h2>
                    <a href="{{ route('dashboard') }}" class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl transition-all group {{ request()->routeIs('dashboard') ? 'bg-blue-50 text-blue-600 border border-blue-100' : '' }}">
                        <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0021 17.882V8.118a2 2 0 00-1.447-1.894L15 4m0 13V4m0 0L9 1"></path>
                            </svg>
                        </div>
                        <span class="text-[11px] font-bold uppercase tracking-wide">Dashboard Peta</span>
                    </a>
                </div>

                {{-- Administration Section --}}
                <div class="pt-6 mt-6 border-t border-slate-200/50 mb-8">
                    <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 mb-4 px-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                        ADMIN SETTINGS
                    </h2>
                    
                    <div class="space-y-1">
                        <a href="{{ route('users.index') }}" class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl transition-all group {{ request()->routeIs('users.*') ? 'bg-blue-50 text-blue-600 border border-blue-100' : '' }}">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                            <span class="text-[11px] font-bold uppercase tracking-wide">Manajemen Pengguna</span>
                        </a>

                        <a href="{{ route('roles.index') }}" class="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-2xl transition-all group {{ request()->routeIs('roles.*') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : '' }}">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <span class="text-[11px] font-bold uppercase tracking-wide">Role & Hak Akses</span>
                        </a>
                    </div>
                </div>
            @endif
        </div>
    </div>
</aside>