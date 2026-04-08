@php
$rayons = include config_path('rayons.php');
if (!is_array($rayons)) $rayons = [];
$pipeSizes = config('gis.pipe_sizes', []);
$accessories = config('gis.accessories', []);
@endphp

<aside id="sidebar" class="fixed inset-y-0 left-0 w-72 bg-glass border-r border-white/20 flex flex-col z-[60] -translate-x-full md:translate-x-0 md:relative transition-all duration-500 ease-in-out shadow-premium">
    <div class="flex-grow overflow-y-auto px-4 py-8 custom-scrollbar">
        <div class="px-2 mb-8">
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
                        @foreach(['Kota Bangga', 'Usman Janatin', 'Goentoer Djarjono', 'Ardilawet', 'Jenderal Soedirman', 'Unit IKK Rembang', 'Unit IKK Bukateja', 'Unit IKK Kemangkon'] as $cabang)
                            <option value="Cabang {{ $cabang }}">Cabang {{ $cabang }}</option>
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
        </div>
    </div>
</aside>