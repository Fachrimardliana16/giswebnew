<?php
require_once __DIR__ . '/../config.php';
?>

<?php
$rayons = [
    '010001',
    '010002',
    '010003',
    '010004',
    '010005',
    '010006',
    '010007',
    '010008',
    '020001',
    '020002',
    '020003',
    '020004',
    '020005',
    '020006',
    '020007',
    '030001',
    '030002',
    '030003',
    '030004',
    '030005',
    '030006',
    '030007',
    '030008',
    '030009',
    '030010',
    '030011',
    '040001',
    '040002',
    '040003',
    '040004',
    '040005',
    '040006',
    '040007',
    '040008',
    '040009',
    '040010',
    '040011',
    '040012',
    '050001',
    '050002',
    '050003',
    '050004',
    '050005',
    '050006',
    '050007',
    '050008',
    '050009',
    '050010',
    '050011',
    '050012',
    '050013',
    '050014',
    '050015',
    '050016',
    '050017',
    '050018',
    '050019',
    '050020',
    '050021',
    '050022',
    '050023',
    '050024',
    '050025',
    '050026',
    '050027',
    '050028',
    '050029',
    '060001',
    '060002',
    '060003',
    '060004',
    '060005',
    '060006',
    '060007',
    '070001',
    '070002',
    '070003',
    '070004',
    '080001',
    '080002',
    '080003',
    '080004',
    '080005',
    '080006',
    '080007',
    '080008',
    '090001',
    '100001',
    '100002',
    '100003',
    '100004',
    '100005',
    '100006',
    '100007',
    '100008',
    '100009',
    '100010',
    '100011',
    '110001',
    '110002',
    '110003',
    '110004',
    '110005',
    '110006',
    '120001',
    '120002',
    '120003',
    '120004',
    '120005',
    '120006',
    '120007',
    '120008',
    '120009',
    '120010',
    '120011',
    '130001',
    '130002',
    '130003',
    '130004',
    '130005',
    '130006',
    '130007',
    '130008',
    '130009',
    '130010',
    '130011',
    '140001',
    '140002',
    '140003',
    '140004',
    '140005',
    '140006',
    '140007',
    '140008',
    '140009',
    '140010',
    '150001',
    '150002',
    '150003',
    '150004',
    '150005',
    '150006',
    '160001',
    '160002',
    '160003',
    '160004',
    '160005',
    '160006',
    '160007',
    '160008',
    '160009',
    '160010',
    '160011',
    '170001',
    '170002',
    '170003',
    '170004',
    '170005',
    '180001',
    '180002',
    '180003',
    '180004',
    '180005',
    '190001',
    '190002',
    '190003',
    '190004',
    '190005',
    '190006',
    '190007',
    '200001',
    '210002',
    '210003',
    '210004',
    '220001',
    '220002',
    '220003',
    '220004',
    '220005',
    '220006',
    '220007',
    '220008',
    '220009',
    '220010',
    '220011',
    '220012',
    '230001',
    '230002',
    '230003',
    '230004',
    '230005',
    '230006',
    '230007',
    '230008',
    '230009',
    '230010',
    '230011',
    '240001',
    '240002',
    '240003',
    '240004',
    '240005',
    '240006',
    '240007',
    '240008',
    '240009',
    '240010',
    '240011',
    '240012',
    '240013',
    '240014',
    '240015',
    '240016',
    '240017',
    '240018',
    '240019',
    '240020',
    '250001',
    '250002',
    '250003',
    '250004',
    '250005',
    '250006',
    '260001',
    '260002',
    '260003',
    '260004',
    '260005',
    '270001',
    '270002',
    '270003',
    '280001',
    '290001',
    '290002',
    '290003',
    '290004',
    '290005',
    '290006',
    '290007',
    '290008',
    '290009',
    '290010',
    '290011',
    '290012',
    '290013',
    '290014',
    '290015',
    '290016',
    '290017',
    '290018',
    '290019',
    '290020',
    '300001',
    '300002',
    '300003',
    '300004',
    '300005',
    '300006',
    '300007',
    '310001',
    '310002',
    '310003',
    '310004',
    '310005',
    '310006',
    '310007',
    '310008',
    '310009',
    '310010',
    '310011',
    '310012',
    '310013',
    '320001',
    '330001',
    '330002',
    '330003',
    '340001',
    '340002',
    '350001',
    '350002',
    '350003',
    '350004',
    '350005',
    '350006',
    '350007',
    '350008',
    '350009',
    '360001',
    '360002',
    '360003',
    '360004',
    '370001',
    '370002',
    '370003',
    '370004',
    '370005',
    '370006',
    '370007',
    '370008',
    '370009',
    '370010',
    '370011',
    '370012',
    '370013',
    '370014',
    '370015',
    '370016',
    '370017',
    '370018',
    '370019',
    '380002',
    '380003',
    '380004',
    '380005',
    '380006',
    '390001',
    '390002',
    '390003',
    '390004',
    '390005',
    '400001',
    '400002',
    '400003',
    '400004',
    '400005',
    '400006',
    '410001',
    '410002',
    '410003',
    '410004',
    '410005',
    '410006',
    '410007',
    '410008',
    '410009',
    '420001',
    '420002',
    '420003',
    '420004',
    '420005',
    '420006',
    '420007',
    '430001',
    '440001',
    '440002',
    '440003',
    '440004',
    '450001',
    '460001',
    '470001',
    '470002',
    '470003',
    '470004',
    '470005',
    '470006',
    '470007',
    '470008',
    '470009',
    '470010',
    '470011',
    '470012',
    '480001',
    '480002',
    '480003',
    '480004',
    '480005',
    '480006',
    '480007',
    '480008',
    '480009',
    '480010',
    '480011',
    '480012',
    '490001',
    '490002',
    '490003',
    '490004',
    '500001',
    '500002',
    '500003',
    '500004',
    '500005',
    '500006',
    '500007',
    '500008',
    '500009',
    '510001',
    '510002',
    '520001',
    '520002',
    '520003',
    '520004',
    '520005',
    '520006',
    '520007',
    '520008',
    '530001',
    '530002',
    '530003',
    '530004',
    '530005',
    '540001',
    '540002',
    '540003',
    '550001',
    '550002',
    '550003',
    '560001',
    '560002',
    '560003',
    '560004',
    '570001',
    '570002',
    '570003',
    '570004',
    '570005',
    '570006',
    '570007',
    '570008',
    '570009',
    '570010',
    '570011',
    '570012',
    '570013',
    '570014',
    '570016',
    '570017',
    '580001',
    '590001',
    '590002',
    '590003',
    '590004',
    '590005',
    '590006',
    '590007',
    '590008',
    '600001',
    '600002',
    '600003',
    '600004',
    '600005',
    '610001',
    '610002',
    '610003',
    '610004',
    '610005',
];
?>

<aside id="sidebar" class="w-64 bg-white border-r flex flex-col hidden md:block">
    <div class="flex-grow overflow-y-auto p-4">
        <h2 class="font-semibold mb-4 text-gray-700">Layer Controls</h2>
        <div class="layer-control space-y-4">
            <!-- Pelanggan Section -->
            <div class="space-y-2 pb-3 border-b">
                <div class="section-header flex items-center justify-between cursor-pointer">
                    <h3 class="font-medium text-sm text-gray-600">Layer Pelanggan</h3>
                    <svg class="w-4 h-4 collapse-icon transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="section-content ml-2 space-y-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                            <input type="checkbox" id="analisa_pelanggan" class="layer-checkbox pelanggan-checkbox">
                            <label for="analisa_pelanggan" class="text-sm">Pelanggan</label>
                        </div>
                    </div>
                    <div class="space-y-4">

                     <!-- Cabang Filter -->
                     <div>
                            <label class="block mb-2 text-sm text-gray-600">Berdasarkan Cabang</label>
                            <select id="cabangFilter" class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="">Semua Cabang</option>
                                <option value="Cabang Kota Bangga">Cabang Kota Bangga</option>
                                <option value="Cabang Usman Janatin">Cabang Usman Janatin</option>
                                <option value="Cabang Goentoer Djarjono">Cabang Goentoer Djarjono</option>
                                <option value="Cabang Ardilawet">Cabang Ardilawet</option>
                                <option value="Cabang Jenderal Soedirman">Cabang Jenderal Soedirman</option>
                                <option value="Unit IKK Rembang">Unit IKK Rembang</option>
                                <option value="Unit IKK Bukateja">Unit IKK Bukateja</option>
                                <option value="Unit IKK Kemangkon">Unit IKK Kemangkon</option>
                            </select>
                        </div>

                        <!-- Status Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Status Pelanggan</label>
                            <select id="statusFilter" class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Status</option>
                                <option value="1">Baru</option>
                                <option value="2">Aktif</option>
                                <option value="3">Tutup Sementara</option>
                                <option value="4">Tutup</option>
                                <option value="5">Bongkar</option>
                            </select>
                        </div>

                        <!-- Rayon Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Rayon</label>
                            <div class="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
                                <?php foreach ($rayons as $rayon): ?>
                                    <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                        <input type="checkbox"
                                            name="rayon[]"
                                            value="<?php echo $rayon; ?>"
                                            class="mr-2 form-checkbox">
                                        <span class="text-sm"><?php echo $rayon; ?></span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <!-- Tarif Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Golongan Tarif</label>
                            <select
                                id="tarifFilter"
                                class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Golongan Tarif</option>
                                <option value="1">ABRI/TNI POLRI</option>
                                <option value="2">TNI Yonif 406 CK</option>
                                <option value="3">Industri Kecil</option>
                                <option value="4">Industri Besar</option>
                                <option value="5">Inst. Pemerintah</option>
                                <option value="6">Niaga Kecil</option>
                                <option value="7">Niaga Besar</option>
                                <option value="8">Rumah Tangga A</option>
                                <option value="9">Rumah Tangga B</option>
                                <option value="10">Rumah Tangga C</option>
                                <option value="11">Sosial Umum</option>
                                <option value="12">Sosial Khusus</option>
                                <option value="13">RT Serang</option>
                                <option value="14">Sosial Umum KRJ</option>
                                <option value="15">RT Kutabawa</option>
                                <option value="16">RT KRETE</option>
                                <option value="17">RT Khusus</option>
                            </select>
                        </div>

                        <!-- Validasi Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Validasi</label>
                            <select id="validFilter" class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Data</option>
                                <option value="true">Valid</option>
                                <option value="false">Tidak Valid</option>
                            </select>
                        </div>

                            <!-- Tunggakan Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Tunggakan</label>
                            <div class="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-white">
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="all" class="mr-2 form-checkbox">
                                    <span class="text-sm">Semua tunggakan</span>
                                </label>
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="3" class="mr-2 form-checkbox">
                                    <span class="text-sm">3 bulan</span>
                                </label>
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="4" class="mr-2 form-checkbox">
                                    <span class="text-sm">4 bulan</span>
                                </label>
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="5" class="mr-2 form-checkbox">
                                    <span class="text-sm">5 bulan</span>
                                </label>
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="6" class="mr-2 form-checkbox">
                                    <span class="text-sm">6 bulan</span>
                                </label>
                                <label class="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                                    <input type="checkbox" name="tunggakan[]" value="above6" class="mr-2 form-checkbox">
                                    <span class="text-sm">lebih dari 6 bulan</span>
                                </label>
                            </div>
                        </div>

                        <!-- Umur WM Filter -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Umur Water Meter</label>
                            <select id="umurWMFilter" class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Umur</option>
                                <option value="none">Tidak Berusia</option>
                                <option value="5">Usia ≤ 5 Tahun</option>
                                <option value="10">Usia 6-10 Tahun</option>
                                <option value="15">Usia 11-15 Tahun</option>
                                <option value="above15">Usia > 15 Tahun</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-2 text-right">
                        <button type="button" id="uncheckPelanggan" class="text-xs text-red-500 hover:text-red-700 transition-colors">
                            Uncheck All
                        </button>
                    </div>
                </div>
            </div>

            <!-- Pengaduan Section -->
                <div class="space-y-2 pb-3 border-b">
                <div class="section-header flex items-center justify-between cursor-pointer">
                    <h3 class="font-medium text-sm text-gray-600">Layer Pengaduan</h3>
                    <svg class="w-4 h-4 collapse-icon transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                    <div class="space-y-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                            <input type="checkbox" id="monitoring_pengaduan" class="layer-checkbox pengduan-checkbox">
                            <label for="monitoring_pengaduan" class="text-sm">Pengaduan</label>
                        </div>
                    </div>
                        <!-- Status Pengaduan Filter -->
                        <div>
                            <label class="block mb-2 text-sm text-gray-600">Status Pengaduan</label>
                            <select id="statusPengaduanFilter" class="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Pengaduan</option>
                                <option value="1">Dilaporkan</option>
                                <option value="2">Diterima</option>
                                <option value="3">Dikerjakan</option>
                                <option value="4">Selesai</option>
                            </select>   
                    </div>
                </div>
            </div>

            <!-- Pipa Section -->
            <div class="space-y-2 pb-3 border-b">
                <div class="section-header flex items-center justify-between cursor-pointer">
                    <h3 class="font-medium text-sm text-gray-600">Layer Pipa</h3>
                    <svg class="w-4 h-4 collapse-icon transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-2 space-y-1 section-content hidden">
                    <?php foreach ($pipeSizes as $size): ?>
                        <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                            <input type="checkbox" id="pipa<?= $size ?>" class="layer-checkbox pipa-checkbox">
                            <label for="pipa<?= $size ?>" class="text-sm">Pipa <?= $size ?>mm</label>
                        </div>
                    <?php endforeach; ?>
                    <div class="mt-2 text-right">
                        <button type="button" id="uncheckPipa" class="text-xs text-red-500 hover:text-red-700 transition-colors">
                            Uncheck All
                        </button>
                    </div>
                </div>
            </div>

            <!-- Pipa Sumber MA Section -->
            <div class="space-y-2 pb-3 border-b">
                <div class="section-header flex items-center justify-between cursor-pointer">
                    <h3 class="font-medium text-sm text-gray-600">Layer Pipa Sumber MA</h3>
                    <svg class="w-4 h-4 collapse-icon transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-2 space-y-4 section-content hidden">
                    <!-- Reservoar Section -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-medium text-gray-600">Reservoar</h4>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaReservoarKaranglewas" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaReservoarKaranglewas" class="text-sm">Reservoar Karanglewas</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaReservoarMeri" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaReservoarMeri" class="text-sm">Reservoar Meri</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaReservoarKaranggambas" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaReservoarKaranggambas" class="text-sm">Reservoar Karanggambas</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaReservoarWalik" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaReservoarWalik" class="text-sm">Reservoar Walik</label>
                            </div>
                        </div>
                    </div>

                    <!-- Mata Air Section -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-medium text-gray-600">Mata Air</h4>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMALimbangan" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMALimbangan" class="text-sm">MA Limbangan</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                    <input type="checkbox" id="pipaMAKajongan" class="layer-checkbox pipa-sumberma-checkbox">
                                    <label for="pipaMAKajongan" class="text-sm">MA Kajongan</label>
                                </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMAMulang2" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMAMulang2" class="text-sm">MA Mulang 2</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMAGombangan" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMAGombangan" class="text-sm">MA Gombangan</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMATukArus" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMATukArus" class="text-sm">MA Tuk Arus</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMASikopyah" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMASikopyah" class="text-sm">MA Sikopyah</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMALimpakdau" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMALimpakdau" class="text-sm">MA Limpakdau</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMAWadasKelir" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMAWadasKelir" class="text-sm">MA Wadas Kelir</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaMAPajerukan" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaMAPajerukan" class="text-sm">MA Pajerukan</label>
                            </div>
                        </div>
                    </div>

                    <!-- CAKOT Section -->
                    <div class="space-y-2">
                        <h4 class="text-xs font-medium text-gray-600">CAKOT</h4>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaCakotWalikKota1" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaCakotWalikKota1" class="text-sm">CAKOT WALIK KOTA 1</label>
                            </div>
                            <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                <input type="checkbox" id="pipaCakotWalikKota2" class="layer-checkbox pipa-sumberma-checkbox">
                                <label for="pipaCakotWalikKota2" class="text-sm">CAKOT WALIK KOTA 2</label>
                            </div>
                        </div>
                    </div>

                    <div class="mt-2 text-right">
                        <button type="button" id="uncheckPipaSumberma" class="text-xs text-red-500 hover:text-red-700 transition-colors">
                            Uncheck All
                        </button>
                    </div>
                </div>
            </div>

            <!-- Accessories Section -->
            <div class="space-y-2 pb-3 border-b">
                <div class="section-header flex items-center justify-between cursor-pointer">
                    <h3 class="font-medium text-sm text-gray-600">Layer Aksesoris</h3>
                    <svg class="w-4 h-4 collapse-icon transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-2 space-y-1 section-content hidden">
                    <?php foreach ($accessories as $id => $label): ?>
                        <div class="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                            <input type="checkbox" id="<?= $id ?>" class="layer-checkbox aksesoris-checkbox">
                            <label for="<?= $id ?>" class="text-sm"><?= $label ?></label>
                        </div>
                    <?php endforeach; ?>
                    <div class="mt-2 text-right">
                        <button type="button" id="uncheckAksesoris" class="text-xs text-red-500 hover:text-red-700 transition-colors">
                            Uncheck All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- User Profile & Logout -->
    <div class="sidebar-footer border-t p-4">
        <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="font-medium text-gray-700 truncate">
                <?php echo htmlspecialchars($_SESSION['user_id']); ?>
            </span>
        </div>
        <a href="logout.php" class="w-full block text-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded transition-colors">
            Logout
        </a>
    </div>
</aside>