@extends('layouts.app')

@section('admin-assets')
    @vite(['resources/js/admin.js'])
@endsection

@section('content')
<div class="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight uppercase">Manajemen Pengguna</h1>
            <p class="text-sm text-slate-500 font-medium">Kelola akses akun dan perizinan sistem.</p>
        </div>
        <div class="flex items-center gap-3">
            <button id="bulkDeleteBtn" data-bulk-delete class="hidden bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Hapus Terpilih (<span id="selectedCount">0</span>)
            </button>
            <button data-modal-open="addUserModal" class="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
                Tambah User Baru
            </button>
        </div>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white/60 backdrop-blur-md border border-white/40 p-4 md:p-6 rounded-3xl shadow-sm">
        <form action="{{ route('users.index') }}" method="GET" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div class="space-y-1.5 w-full">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cari Pengguna</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Username/Nama..." class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-11 pr-4 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                </div>
            </div>
            
            <div class="space-y-1.5 w-full">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Filter Berdasarkan Role</label>
                <select name="role_id" class="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                    <option value="">Semua Role</option>
                    @foreach($roles as $role)
                        <option value="{{ $role->id }}" {{ request('role_id') == $role->id ? 'selected' : '' }}>{{ strtoupper(str_replace('_', ' ', $role->name)) }}</option>
                    @endforeach
                </select>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
                <button type="submit" class="bg-slate-800 text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    Filter
                </button>
                <a href="{{ route('users.index') }}" class="bg-slate-200 text-slate-600 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-300 transition-all text-center flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Reset
                </a>
            </div>
        </form>
    </div>

    @if(session('success'))
    <div class="bg-emerald-50 border border-emerald-200 text-emerald-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
        {{ session('success') }}
    </div>
    @endif

    @if(session('error'))
    <div class="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        {{ session('error') }}
    </div>
    @endif

    <!-- Table -->
    <div class="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 w-10">
                            <input type="checkbox" id="selectAll" class="w-4 h-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer">
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <a href="{{ request()->fullUrlWithQuery(['sort' => 'name', 'order' => request('order') == 'asc' ? 'desc' : 'asc']) }}" class="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                Identitas User
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                            </a>
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <a href="{{ request()->fullUrlWithQuery(['sort' => 'username', 'order' => request('order') == 'asc' ? 'desc' : 'asc']) }}" class="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                Username
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                            </a>
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Akses</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <a href="{{ request()->fullUrlWithQuery(['sort' => 'created_at', 'order' => request('order') == 'asc' ? 'desc' : 'asc']) }}" class="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                Dibuat Pada
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                            </a>
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @forelse($users as $user)
                    <tr class="hover:bg-blue-50/30 transition-colors group">
                        <td class="px-6 py-4">
                            <input type="checkbox" name="ids[]" value="{{ $user->id }}" class="user-checkbox w-4 h-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer">
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                                    {{ strtoupper(substr($user->username, 0, 1)) }}
                                </div>
                                <div class="font-bold text-slate-700 text-sm">{{ $user->name ?? '-' }}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{{ $user->username }}</span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                                {{ str_replace('_', ' ', $user->role->name ?? 'No Role') }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-xs text-slate-500 font-medium">
                            {{ $user->created_at->format('d M Y') }}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button data-user-edit='{{ json_encode($user, JSON_HEX_APOS | JSON_HEX_QUOT) }}' aria-label="Edit user {{ $user->username }}" title="Edit" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                    </svg>
                                </button>
                                <button data-user-delete="{{ $user->id }}" aria-label="Hapus user {{ $user->username }}" title="Hapus" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium italic">
                            Tidak ada data pengguna ditemukan.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        @if($users->hasPages())
        <div class="p-6 bg-slate-50/50 border-t border-slate-100">
            {{ $users->links() }}
        </div>
        @endif
    </div>
</div>

<!-- Add User Modal -->
<div id="addUserModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden p-4">
    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-black text-slate-800 uppercase tracking-tighter">Tambah User Baru</h3>
            <button data-modal-close="addUserModal" aria-label="Tutup dialog tambah user" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <form action="{{ route('users.store') }}" method="POST" class="p-6 space-y-4">
            @csrf
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nama Lengkap</label>
                <input type="text" name="name" placeholder="E.g. Satrio Wijaya" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Username Login</label>
                <input type="text" name="username" required placeholder="E.g. satrio" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                <input type="password" name="password" required placeholder="Min. 6 Karakter" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Role / Perizinan</label>
                <select name="role_id" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                    @foreach($roles as $role)
                        <option value="{{ $role->id }}">{{ strtoupper(str_replace('_', ' ', $role->name)) }}</option>
                    @endforeach
                </select>
            </div>
            <div class="pt-2 flex gap-3">
                <button type="button" data-modal-close="addUserModal" class="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" class="flex-1 bg-blue-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Simpan User</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit User Modal -->
<div id="editUserModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden p-4">
    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-black text-slate-800 uppercase tracking-tighter">Edit Data User</h3>
            <button data-modal-close="editUserModal" aria-label="Tutup dialog edit user" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <form id="editUserForm" method="POST" class="p-6 space-y-4">
            @csrf
            @method('PUT')
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nama Lengkap</label>
                <input type="text" name="name" id="edit_name" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Username Login</label>
                <input type="text" name="username" id="edit_username" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password Baru (Kosongkan jika tdk diubah)</label>
                <input type="password" name="password" placeholder="Minimal 6 Karakter" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Role / Perizinan</label>
                <select name="role_id" id="edit_role_id" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                    @foreach($roles as $role)
                        <option value="{{ $role->id }}">{{ strtoupper(str_replace('_', ' ', $role->name)) }}</option>
                    @endforeach
                </select>
            </div>
            <div class="pt-2 flex gap-3">
                <button type="button" data-modal-close="editUserModal" class="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" class="flex-1 bg-blue-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Perbarui Data</button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<form id="deleteUserForm" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

<!-- Bulk Delete Form -->
<form id="bulkDeleteForm" action="{{ route('users.bulkDestroy') }}" method="POST" class="hidden">
    @csrf
</form>

@endsection
