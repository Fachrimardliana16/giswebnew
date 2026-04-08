<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - WebGIS PDAM</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 antialiased overflow-y-auto">
    <div class="min-h-screen flex">
        <!-- Left Panel: Gradient and Branding (Hidden on mobile) -->
        <div class="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-white items-center justify-center p-12 relative overflow-hidden">
            <!-- Subtle Decorative Circles -->
            <div class="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            
            <div class="relative z-10 text-center max-w-lg">
                <div class="mb-8 inline-block p-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl">
                    <img src="https://cdn-icons-png.flaticon.com/512/7471/7471547.png" alt="Logo" class="w-16 h-16 drop-shadow-lg">
                </div>
                <h1 class="text-5xl font-black text-white leading-tight tracking-tighter mb-4 drop-shadow-md uppercase">
                    WEB<span class="text-blue-100">GIS</span><br>
                    TIRTA PERWIRA
                </h1>
                <p class="text-xl font-bold text-blue-100 uppercase tracking-[0.2em] mb-6 opacity-90 leading-none">
                    Kabupaten Purbalingga
                </p>
                <div class="h-1 w-24 bg-white/50 mx-auto rounded-full mb-8"></div>
                <p class="text-blue-100/80 text-lg font-medium italic">
                    "Sistem Informasi Geografis Terpadu Pelanggan Perumdam Tirta Perwira"
                </p>
            </div>
        </div>

        <!-- Right Panel: Login Form -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20">
            <div class="max-w-md w-full">
                <!-- Mobile Logo Header -->
                <div class="lg:hidden text-center mb-6">
                    <img src="https://cdn-icons-png.flaticon.com/512/7471/7471547.png" alt="Logo" class="w-12 h-12 mx-auto mb-3">
                    <h2 class="text-2xl font-black text-slate-800 tracking-tighter uppercase">WEB<span class="text-blue-600">GIS</span></h2>
                    <p class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Tirta Perwira</p>
                </div>

                <div class="mb-6 lg:mb-10 text-center lg:text-left">
                    <h3 class="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight mb-1 lg:mb-2 leading-tight">Selamat Datang di WEBGIS</h3>
                    <p class="text-slate-500 text-sm lg:text-base font-medium">Silakan login untuk mengakses dashboard</p>
                </div>

                @if($errors->has('error'))
                <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl shadow-sm">
                    <div class="flex">
                        <div class="flex-shrink-0 text-red-500">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-xs font-black text-red-800 uppercase tracking-wide">
                                {{ $errors->first('error') }}
                            </p>
                        </div>
                    </div>
                </div>
                @endif

                <form action="{{ url('/login') }}" method="POST" class="space-y-6">
                    @csrf
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg class="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input type="text" name="username" value="{{ old('username') }}" required 
                                   class="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder:text-slate-300 shadow-sm"
                                   placeholder="Masukkan username anda">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg class="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input type="password" name="password" required 
                                   class="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all duration-300 placeholder:text-slate-300 shadow-sm"
                                   placeholder="Masukkan password anda">
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-1 lg:pt-2">
                        <label class="flex items-center group cursor-pointer">
                            <div class="relative flex items-center">
                                <input type="checkbox" class="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 transition-all checked:border-blue-600 checked:bg-blue-600 focus:outline-none">
                                <svg class="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span class="ml-2.5 text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Ingat saya</span>
                        </label>
                        <a href="#" class="text-[10px] uppercase font-black tracking-widest text-blue-600 hover:text-blue-700 transition-colors">Lupa Password?</a>
                    </div>

                    <button type="submit" 
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 lg:py-5 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-8 focus:ring-blue-500/30">
                        Masuk Ke Sistem
                    </button>
                </form>

                <div class="mt-8 lg:mt-16 text-center pb-6">
                    <p class="text-[8px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">Powered By</p>
                    <div class="flex flex-col gap-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span class="text-blue-600">Tirta</span> Perwira
                        </p>
                        <p class="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                            IT Department & GIS Team © 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

