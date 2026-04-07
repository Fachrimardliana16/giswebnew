<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - WebGIS PDAM</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full p-6">
            <div class="bg-white rounded-lg shadow-lg p-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold text-gray-800">WEBGIS</h2>
                    <h2 class="text-2xl font-bold text-gray-800">TIRTA PERWIRA</h2>
                    <p class="text-gray-600">Kabupaten Purbalingga</p>
                    <br>
                    <p class="text-gray-600">Silakan login untuk melanjutkan</p>
                </div>

                @if($errors->has('error'))
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {{ $errors->first('error') }}
                </div>
                @endif

                <form action="{{ url('/login') }}" method="POST" class="space-y-6">
                    @csrf
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input type="text" name="username" value="{{ old('username') }}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" name="password" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" 
                            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        Login
                    </button>
                </form>
            </div>
            <div class="text-center mt-4 text-sm text-gray-600">
                Copyright © 2021 Tirta Perwira<br>
                Departement IT dan Tim GIS
            </div>
        </div>
    </div>
</body>
</html>
