<header class="bg-blue-600 text-white p-3 shadow-lg">
    <div class="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div class="flex items-center justify-between w-full md:w-auto">
            <div class="flex items-center gap-4">
                <button id="sidebarToggle" class="flex items-center">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
                <div class="bg-white p-1 rounded-full shadow-sm">
                    <img src="https://cdn-icons-png.flaticon.com/128/7471/7471547.png" alt="WebGIS Icon" class="w-10 h-10 object-cover filter brightness-110 contrast-125" />
                </div>
                <h1 class="text-lg font-bold md:ml-4">WebGIS Tirta Perwira</h1>
            </div>
            <button id="searchToggle" class="p-2 hover:bg-blue-700 rounded transition md:hidden ml-4" aria-label="Toggle Search">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
        </div>
        <div id="searchBar" class="mt-4 md:mt-0 w-full md:w-auto md:ml-4 hidden md:block">
            <div class="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                <input type="text" id="searchInput" placeholder="Ketik no. langganan.." class="px-3 py-1 rounded text-gray-800 w-full md:w-48 focus:outline-none focus:ring-2">
                <select id="searchLayer" class="px-3 py-1 rounded text-gray-800 w-full md:w-auto focus:outline-none focus:ring-2">
                    <option value="analisa_pelanggan">Pelanggan</option>
                </select>
                <button onclick="searchFeatures()" class="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition w-full md:w-auto">
                    Cari
                </button>
            </div>
        </div>
    </div>
</header>