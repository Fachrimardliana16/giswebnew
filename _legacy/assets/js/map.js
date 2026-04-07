// export const setupSearchFeatures = (map, layers) => {
//     if (!map || typeof map.addLayer !== 'function') {
//         console.error('Invalid map object', map);
//         return;
//     }

//     let currentMarker = null;
//     let currentPopup = null;

//     window.searchFeatures = function () {
//         const searchInput = document.getElementById('searchInput');
//         const searchLayer = document.getElementById('searchLayer');

//         if (!searchInput || !searchLayer) {
//             console.warn('Elemen pencarian tidak ditemukan');
//             return;
//         }

//         const searchText = searchInput.value.trim();
//         const selectedLayer = searchLayer.value;

//         if (!searchText) {
//             alert('Silakan masukkan kata kunci pencarian');
//             return;
//         }

//         // Clean up previous search results
//         cleanup();

//         const pelangganCheckbox = document.getElementById('watermeterpelanggan');
//         if (pelangganCheckbox && !pelangganCheckbox.checked) {
//             pelangganCheckbox.checked = true;
//             layers.watermeterpelanggan.addTo(map);
//         }

//         const searchUrl = `${GEOSERVER_URL.replace('/wms', '/wfs')}?service=WFS&version=1.0.0&request=GetFeature&typeName=webgis:${selectedLayer}&CQL_FILTER=nolang%20ILIKE%20%27%25${encodeURIComponent(searchText)}%25%27&outputFormat=application/json`;

//         fetch(searchUrl)
//             .then(response => {
//                 if (!response.ok) throw new Error('Gagal mencari data');
//                 return response.json();
//             })
//             .then(data => {
//                 if (data.features && data.features.length > 0) {
//                     const feature = data.features[0];
//                     const coordinates = feature.geometry.coordinates;
//                     const latlng = L.latLng(coordinates[1], coordinates[0]);

//                     map.setView(latlng, 19);
//                     showPopup(feature, latlng, coordinates);
//                 } else {
//                     alert('Tidak ditemukan hasil yang cocok');
//                 }
//             })
//             .catch(error => {
//                 console.error('Kesalahan pencarian:', error);
//                 if (error.message.includes('Failed to fetch')) {
//                     alert('Gagal terhubung ke server. Periksa koneksi internet Anda.');
//                 } else {
//                     alert(`Terjadi kesalahan: ${error.message}`);
//                 }
//             });
//     };

//     function cleanup() {
//         if (currentMarker) {
//             map.removeLayer(currentMarker);
//             currentMarker = null;
//         }
//         if (currentPopup) {
//             map.closePopup(currentPopup);
//             currentPopup = null;
//         }
//     }

//     function showPopup(feature, latlng, coordinates) {
//         try {
//             const properties = feature.properties;
//             console.log('Raw properties:', properties);

//             const orderedFields = [
//                 { key: 'nolang', label: 'No. Langganan' },
//                 { key: 'nama', label: 'Nama Pelanggan' },
//                 { key: 'alamat', label: 'Alamat' },
//                 { key: 'tarif', label: 'Golongan Tarif' },
//                 { key: 'isvalid', label: 'Validasi' },
//                 { key: 'nomorseri', label: 'Nomor Seri' },  // Keep nomorseri for this field
//                 { key: 'merk', label: 'Merk' }
//             ];

//             const content = orderedFields
//                 .map(field => {
//                     let value = properties[field.key];

//                     if (field.key === 'isvalid') {
//                         value = value ? '<span class="text-green-600">Valid</span>' : '<span class="text-red-600">Tidak Valid</span>';
//                     }
//                     if (value === null || value === undefined) {
//                         value = '<span class="text-gray-400">-</span>';
//                     }

//                     return `
//                     <tr class="hover:bg-gray-50 transition-colors">
//                         <td class="px-3 py-2 border-b border-gray-200 font-medium text-gray-600">
//                             ${field.label}
//                         </td>
//                         <td class="px-3 py-2 border-b border-gray-200 text-gray-800">
//                             ${value}
//                         </td>
//                     </tr>`;
//                 })
//                 .join('');

//             const popupContent = `
//             <div class="rounded-lg shadow-sm overflow-hidden">
//                 <div class="bg-blue-50 px-4 py-2 border-b border-blue-100">
//                     <h3 class="font-semibold text-blue-800">Hasil Uhuy</h3>
//                 </div>
//                 <div class="max-h-[300px] overflow-y-auto bg-white p-2">
//                     <table class="w-full border-collapse">
//                         <tbody>
//                             ${content}
//                         </tbody>
//                     </table>
//                 </div>
//                 <div class="bg-gray-50 px-4 py-2 border-t border-gray-200">
//                     <button onclick="window.open('https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}', '_blank')" 
//                             class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm 
//                                    transition-colors duration-200 flex items-center justify-center gap-2 text-sm">
//                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
//                                   d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
//                         </svg>
//                         Lihat di Maps
//                     </button>
//                 </div>
//             </div>`;

//             // Create marker
//             currentMarker = L.marker(latlng, {
//                 icon: L.divIcon({
//                     className: 'custom-marker',
//                     html: `
//                         <div class="relative">
//                             <div class="absolute inset-0 bg-blue-500 opacity-50 rounded-full animate-ping"></div>
//                             <div class="relative z-10 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
//                         </div>
//                     `,
//                     iconSize: [24, 24],
//                     iconAnchor: [12, 12]
//                 })
//             }).addTo(map);

//             // Create popup
//             currentPopup = L.popup({
//                 maxWidth: 400,
//                 className: 'custom-popup',
//                 closeButton: true,
//                 autoClose: false,
//                 closeOnClick: false
//             })
//             .setLatLng(latlng)
//             .setContent(popupContent);

//             // Bind popup to marker and open it
//             currentMarker.bindPopup(currentPopup).openPopup();

//             // Handle cleanup when popup is closed
//             currentMarker.on('popupclose', cleanup);

//         } catch (error) {
//             console.error('Kesalahan detail saat menampilkan popup:', error);
//             cleanup();
//             alert('Terjadi kesalahan saat menampilkan informasi. Silakan coba lagi.');
//         }
//     }
// };