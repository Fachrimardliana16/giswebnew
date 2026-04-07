import { formatDate, formatCurrency, formatNumber, getTariffName } from '../utils/helpers.js';

// Only have one set of exports at the start of the file
export {
  createCustomerPopupContent,
  createPipePopupContent,
  createAccessoryPopupContent,
  getAccessoryFields,
  generatePopupContent
};

/**
 * Generate customer popup content
 * @param {Object} properties - Feature properties
 * @param {Array} coordinates - Feature coordinates [lng, lat]
 * @returns {string} HTML content for popup
 */
const createCustomerPopupContent = (properties, coordinates) => {
  const orderedFields = [
    { key: 'nolang', label: 'No. Langganan' },
    { key: 'nama', label: 'Nama Pelanggan' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'tarif', label: 'Golongan Tarif', transform: getTariffName },
    { key: 'status', label: 'Status Pelanggan' },
    { key: 'nama_cabang', label: 'Cabang' },
    { key: 'wm_merk', label: 'Merk WM' },
    { key: 'wm_noseri', label: 'Nomor Seri WM' },
    { key: 'wm_tglgantimeter', label: 'Tanggal Ganti WM', transform: formatDate },
    { key: 'umurwm_tahun', label: 'Umur WM (Tahun)' },
    { key: 'bacameter_namacater', label: 'Nama Petugas' },
    { key: 'bacameter_tglbaca', label: 'Tanggal Baca', transform: formatDate },
    { key: 'lama', label: 'Stand Meter Awal', transform: formatNumber },
    { key: 'baru', label: 'Stand Meter Akhir', transform: formatNumber },
    { key: 'm3', label: 'Pemakaian (m³)', transform: formatNumber },
    { key: 'rata2', label: 'Rata-rata Pemakaian (m³)', transform: formatNumber },
    { key: 'tungg_lembar', label: 'Lama Tunggakan (Bulan)' },
    { key: 'tungg_rptagihan', label: 'Total Tunggakan', transform: formatCurrency },
    { key: 'tungg_cicilan', label: 'Cicilan' },
    {
      key: 'tgllunas',
      label: 'Tanggal Lunas',
      transform: (value) => !value ? '<span class="text-red-600">Belum Lunas</span>' : formatDate(value)
    },
    { key: 'fotorumah', label: 'Foto Rumah' },
    { key: 'fotowm', label: 'Foto WM' }
  ];

  return generatePopupContent(properties, orderedFields, coordinates, 'Informasi Pelanggan');
};

/**
 * Generate pipe popup content
 * @param {Object} properties - Feature properties
 * @param {Object} latlng - Popup position
 * @returns {string} HTML content for popup
 */
const createPipePopupContent = (properties, latlng) => {
  const orderedFields = [
    { key: 'id', label: 'ID' },
    { key: 'diameter', label: 'Diameter (mm)' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'merk', label: 'Merk' },
    { key: 'tglpasang', label: 'Tanggal Pasang', transform: formatDate },
    { key: 'pelaksana', label: 'Pelaksana' },
    { key: 'nospk', label: 'Nomor SPK' },
    { key: 'sumberdana', label: 'Sumber Dana' },
    { key: 'length', label: 'Panjang (m)', transform: formatNumber },
    { key: 'kedalaman', label: 'Kedalaman (m)', transform: formatNumber },
    { key: 'standar', label: 'Standar' },
    { key: 'jnsjringan', label: 'Jenis Jaringan' },
    { key: 'sumberma', label: 'Sumber MA' },
    { key: 'unitikk', label: 'Unit' },
    { key: 'dma', label: 'DMA' },
    {
      key: 'isvalid',
      label: 'Status Validasi',
      transform: (value) => value ? '<span class="text-green-600">Valid</span>' : '<span class="text-red-600">Tidak Valid</span>'
    },
    { key: 'drafter', label: 'Drafter' },
  ];

  return generatePopupContent(properties, orderedFields, [latlng.lng, latlng.lat], 'Informasi Pipa');
};

/**
 * Create popup content for accessory features
 * @param {Object} properties - Feature properties
 * @param {Array} coordinates - Feature coordinates
 * @param {string} type - Accessory type
 */
const createAccessoryPopupContent = (properties, coordinates, type) => {
  const typeMap = {
    all_airvalve: 'Air Valve',
    all_bend: 'Bend',
    all_checkvalve: 'Check Valve',
    all_dop: 'Dop',
    all_firehydrant: 'Fire Hydrant',
    all_gatevalve: 'Gate Valve',
    all_meterinduk: 'Meter Induk',
    all_prv: 'PRV',
    all_reducer: 'Reducer',
    all_strainer: 'Strainer',
    all_tee: 'Tee',
    all_titik_tekanan: 'Titik Tekanan',
    all_washout: 'Washout'
  };

  const accessoryName = typeMap[type] || 'Unknown Accessory';

  return `
    <div class="rounded-lg shadow-sm overflow-hidden">
      <div class="bg-blue-50 px-2 py-1 border-b border-blue-100">
        <h3 class="font-semibold text-blue-800 text-sm">Informasi ${accessoryName}</h3>
      </div>
      <div class="max-h-[200px] overflow-y-auto bg-white p-1">
        <table class="w-full border-collapse text-left">
          <tbody>
            ${Object.entries(properties)
              .filter(([key]) => !['geom', 'geometry'].includes(key))
              .map(([key, value]) => `
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">${key}</td>
                  <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">${value || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
      <div class="bg-gray-50 px-2 py-1 border-t border-gray-200">
        <button 
          onclick="window.open('https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}', '_blank')"
          class="w-full px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm
                 transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          Lihat di Maps
        </button>
      </div>
    </div>
  `;
};

/**
 * Shared function to generate popup content
 * @param {Object} properties - Feature properties
 * @param {Array} fields - Fields configuration
 * @param {Array} coordinates - Coordinates [lng, lat]
 * @param {string} title - Popup title
 * @param {Function} customTransform - Custom transform function
 * @returns {string} HTML content
 */
const generatePopupContent = (properties, fields, coordinates, title, customTransform = null) => {
  const content = fields
    .map(field => {
      let value = properties[field.key];

      if (field.transform) {
        value = field.transform(value);
      } else if (field.key === 'isvalid') {
        value = value ? '<span class="text-green-600">Valid</span>' : '<span class="text-red-600">Tidak Valid</span>';
      } else if (customTransform) {
        value = customTransform(field.key, value);
      }

      if (value === null || value === undefined || value === '') {
        value = '<span class="text-gray-400">-</span>';
      }

      return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-2 py-1 border-b border-gray-200 text-sm font-medium text-gray-600">
          ${field.label}
        </td>
        <td class="px-2 py-1 border-b border-gray-200 text-sm text-gray-800">
          ${value}
        </td>
      </tr>`;
    })
    .join('');

  return `
  <div class="rounded-lg shadow-sm overflow-hidden" style="max-width: 280px;">
    <div class="bg-blue-50 px-2 py-1 border-b border-blue-100">
      <h3 class="font-semibold text-blue-800 text-sm">${title}</h3>
    </div>
    <div class="max-h-[200px] overflow-y-auto bg-white p-1">
      <table class="w-full border-collapse text-left">
        <tbody>
          ${content}
        </tbody>
      </table>
    </div>
    <div class="bg-gray-50 px-2 py-1 border-t border-gray-200">
      <button onclick="window.open('https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}', '_blank')"
              class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm
                    transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
        Lihat di Maps
      </button>
    </div>
  </div>`;
};

/**
 * Transform accessory field values
 * @param {string} key - Field key
 * @param {any} value - Field value
 * @returns {string} Transformed value
 */
const transformAccessoryValue = (key, value) => {
  if (key === 'kondisi' || key === 'kodisi') {
    return value === 'baik' ?
      '<span class="text-green-600">Baik</span>' :
      '<span class="text-yellow-600">Perlu Perawatan</span>';
  }
  return value;
};

/**
 * Get accessory field configuration based on type
 * @param {string} type - Accessory type
 * @returns {Array} Field configuration
 */
const getAccessoryFields = (type) => {
  const typeKey = type.replace('all_', '');

  const fieldConfigs = {
    airvalve: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'dia', label: 'Diameter (mm)' },
      { key: 'diapipa', label: 'Diameter Pipa (mm)' },
      { key: 'model', label: 'Model' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    gatevalve: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'dia', label: 'Diameter (mm)' },
      { key: 'diapipa', label: 'Diameter Pipa (mm)' },
      { key: 'model', label: 'Model' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'kodisi', label: 'Kondisi' },
      { key: 'jmlputaran', label: 'Jumlah Putaran' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    firehydrant: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'diameter', label: 'Diameter (mm)' },
      { key: 'tglpasang', label: 'Tanggal Pasang', transform: formatDate },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'alatukur', label: 'Alat Ukur' },
      { key: 'jenis', label: 'Jenis' },
      { key: 'merk', label: 'Merk' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    checkvalve: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'dia', label: 'Diameter (mm)' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'diapipa', label: 'Diameter Pipa (mm)' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    meterinduk: [
      { key: 'diameter', label: 'Diameter (mm)' },
      { key: 'tipe', label: 'Tipe' },
      { key: 'merk', label: 'Merk' },
      { key: 'tglpasang', label: 'Tanggal Pasang', transform: formatDate },
      { key: 'pelaksana', label: 'Pelaksana' },
      { key: 'nospk', label: 'No. SPK' },
      { key: 'sumberdana', label: 'Sumber Dana' },
      { key: 'jnsjarngan', label: 'Jenis Jaringan' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    prv: [
      { key: 'diameter', label: 'Diameter (mm)', transform: formatNumber },
      { key: 'tglpasang', label: 'Tanggal Pasang', transform: formatDate },
      { key: 'pilot', label: 'Pilot' },
      { key: 'nocard', label: 'No. Card' },
      { key: 'logger', label: 'Logger' },
      { key: 'airvalve', label: 'Air Valve' },
      { key: 'timer', label: 'Timer' },
      { key: 'timerset', label: 'Timer Setting' },
      { key: 'merk', label: 'Merk' },
      { key: 'daypresureset', label: 'Day Pressure Set', transform: formatNumber },
      { key: 'nightpresureset', label: 'Night Pressure Set', transform: formatNumber },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    reducer: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'diameter', label: 'Diameter' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'materi', label: 'Material' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    strainer: [
      { key: 'diameter', label: 'Diameter (mm)', transform: formatNumber },
      { key: 'tglpasang', label: 'Tanggal Pasang', transform: formatDate },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    tee: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'diamater', label: 'Diameter' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'materi', label: 'Material' },
      { key: 'jnsjringan', label: 'Jenis Jaringan' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    titik_tekanan: [
      { key: 'nolang', label: 'No. Langganan' },
      { key: 'alamat', label: 'Alamat' },
      { key: 'tanggal', label: 'Tanggal', transform: formatDate },
      { key: 'jenis_jaringan', label: 'Jenis Jaringan' },
      { key: 'diameter', label: 'Diameter (mm)' },
      { key: 'jam_pagi', label: 'Jam Pagi' },
      { key: 'tekanan_pagi', label: 'Tekanan Pagi (Bar)', transform: formatNumber },
      { key: 'jam_sore', label: 'Jam Sore' },
      { key: 'tekanan_sore', label: 'Tekanan Sore (Bar)', transform: formatNumber },
      { key: 'jam_malam', label: 'Jam Malam' },
      { key: 'tekanan_malam', label: 'Tekanan Malam (Bar)', transform: formatNumber },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    washout: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'dia', label: 'Diameter (mm)' },
      { key: 'diapipa', label: 'Diameter Pipa (mm)' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'kondisi', label: 'Kondisi' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    dop: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'diameter', label: 'Diameter' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'materi', label: 'Material' },
      { key: 'jnsjringan', label: 'Jenis Jaringan' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ],
    bend: [
      { key: 'alamat', label: 'Alamat' },
      { key: 'diameter', label: 'Diameter' },
      { key: 'thnpasang', label: 'Tahun Pasang' },
      { key: 'materi', label: 'Material' },
      { key: 'jnsjringan', label: 'Jenis Jaringan' },
      { key: 'isvalid', label: 'Status Validasi' },
      { key: 'drafter', label: 'Drafter' },
    ]
  };

  // Default fields if specific configuration not found
  return fieldConfigs[typeKey] || [
    { key: 'alamat', label: 'Alamat' },
    { key: 'diameter', label: 'Diameter' },
    { key: 'thnpasang', label: 'Tahun Pasang' },
    { key: 'isvalid', label: 'Status Validasi' },
    { key: 'drafter', label: 'Drafter' },
  ];
};
