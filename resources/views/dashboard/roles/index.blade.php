@extends('layouts.app')

@section('content')
<div class="p-6 space-y-6 overflow-y-auto custom-scrollbar h-full">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight uppercase">Manajemen Role</h1>
            <p class="text-sm text-slate-500 font-medium">Kelola tingkat perizinan dan akses sistem.</p>
        </div>
        <div class="flex items-center gap-3">
            <button id="bulkDeleteBtn" onclick="bulkDelete()" class="hidden bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Hapus Terpilih (<span id="selectedCount">0</span>)
            </button>
            <button onclick="document.getElementById('addRoleModal').classList.remove('hidden')" class="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
                Tambah Role Baru
            </button>
        </div>
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
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
                            <input type="checkbox" id="selectAll" class="w-4 h-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500/20 transition-all cursor-pointer">
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <a href="{{ request()->fullUrlWithQuery(['sort' => 'name', 'order' => request('order') == 'asc' ? 'desc' : 'asc']) }}" class="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                Nama Role
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                            </a>
                        </th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Pengguna</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <a href="{{ request()->fullUrlWithQuery(['sort' => 'created_at', 'order' => request('order') == 'asc' ? 'desc' : 'asc']) }}" class="flex items-center gap-1 hover:text-emerald-600 transition-colors">
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
                    @forelse($roles as $role)
                    <tr class="hover:bg-emerald-50/30 transition-colors group">
                        <td class="px-6 py-4">
                            <input type="checkbox" name="ids[]" value="{{ $role->id }}" class="role-checkbox w-4 h-4 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500/20 transition-all cursor-pointer">
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-slate-700 uppercase tracking-tight">{{ str_replace('_', ' ', $role->name) }}</span>
                                @if($role->permissions)
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        @foreach($role->permissions as $perm)
                                            <span class="text-[8px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">{{ str_replace('_', ' ', $perm) }}</span>
                                        @endforeach
                                    </div>
                                @endif
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{{ $role->users_count }} User</span>
                        </td>
                        <td class="px-6 py-4 text-xs text-slate-500 font-medium">
                            {{ $role->created_at->format('d M Y') }}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button onclick="editRole({{ json_encode($role) }})" aria-label="Edit role {{ $role->name }}" title="Edit" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                    </svg>
                                </button>
                                <button onclick="deleteRole({{ $role->id }})" aria-label="Hapus role {{ $role->name }}" title="Hapus" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium italic">
                            Belum ada data role.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Role Modal -->
<div id="addRoleModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-black text-slate-800 uppercase tracking-tighter">Tambah Role Baru</h3>
            <button onclick="document.getElementById('addRoleModal').classList.add('hidden')" aria-label="Tutup dialog tambah role" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <form action="{{ route('roles.store') }}" method="POST" class="p-6 space-y-6">
            @csrf
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nama Role</label>
                <input type="text" name="name" required placeholder="E.g. admin_lapangan" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all">
            </div>

            <div class="space-y-3">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hak Akses (Permissions)</label>
                <div class="grid grid-cols-2 gap-3">
                    @foreach(['dashboard_peta', 'manajemen_user', 'manajemen_role', 'filter_pelanggan', 'filter_pipa', 'monitoring_pengaduan'] as $perm)
                    <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-white hover:border-emerald-200 transition-all group">
                        <input type="checkbox" name="permissions[]" value="{{ $perm }}" class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20">
                        <span class="text-xs font-bold text-slate-600 group-hover:text-emerald-700 capitalize">{{ str_replace('_', ' ', $perm) }}</span>
                    </label>
                    @endforeach
                </div>
            </div>

            <div class="pt-2 flex gap-3">
                <button type="button" onclick="document.getElementById('addRoleModal').classList.add('hidden')" class="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" class="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">Simpan Role</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Role Modal -->
<div id="editRoleModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-lg font-black text-slate-800 uppercase tracking-tighter">Edit Data Role</h3>
            <button onclick="document.getElementById('editRoleModal').classList.add('hidden')" aria-label="Tutup dialog edit role" class="text-slate-400 hover:text-slate-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <form id="editRoleForm" method="POST" class="p-6 space-y-6">
            @csrf
            @method('PUT')
            <div class="space-y-1.5">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nama Role</label>
                <input type="text" name="name" id="edit_name" required class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
            </div>

            <div class="space-y-3">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hak Akses (Permissions)</label>
                <div class="grid grid-cols-2 gap-3" id="edit_permissions_container">
                    @foreach(['dashboard_peta', 'manajemen_user', 'manajemen_role', 'filter_pelanggan', 'filter_pipa', 'monitoring_pengaduan'] as $perm)
                    <label class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-white hover:border-emerald-200 transition-all group">
                        <input type="checkbox" name="permissions[]" value="{{ $perm }}" id="edit_perm_{{ $perm }}" class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20">
                        <span class="text-xs font-bold text-slate-600 group-hover:text-emerald-700 capitalize">{{ str_replace('_', ' ', $perm) }}</span>
                    </label>
                    @endforeach
                </div>
            </div>

            <div class="pt-2 flex gap-3">
                <button type="button" onclick="document.getElementById('editRoleModal').classList.add('hidden')" class="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                <button type="submit" class="flex-1 bg-blue-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Perbarui Role</button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<form id="deleteRoleForm" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

<!-- Bulk Delete Form -->
<form id="bulkDeleteForm" action="{{ route('roles.bulkDestroy') }}" method="POST" class="hidden">
    @csrf
</form>

<script>
    const selectAll = document.getElementById('selectAll');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const selectedCount = document.getElementById('selectedCount');

    if (selectAll) {
        selectAll.addEventListener('change', function() {
            document.querySelectorAll('.role-checkbox').forEach(cb => {
                cb.checked = this.checked;
            });
            updateBulkButton();
        });
    }

    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('role-checkbox')) {
            updateBulkButton();
        }
    });

    function updateBulkButton() {
        const checkedCount = document.querySelectorAll('.role-checkbox:checked').length;
        if (selectedCount) selectedCount.textContent = checkedCount;
        
        if (bulkDeleteBtn) {
            if (checkedCount > 0) {
                bulkDeleteBtn.classList.remove('hidden');
            } else {
                bulkDeleteBtn.classList.add('hidden');
            }
        }
    }

    function bulkDelete() {
        if (confirm('Apakah Anda yakin ingin menghapus role yang terpilih secara massal? Role yang masih memiliki pengguna akan dilewati.')) {
            const form = document.getElementById('bulkDeleteForm');
            const checkedBoxes = document.querySelectorAll('.role-checkbox:checked');
            
            // Clear previous inputs
            form.querySelectorAll('input[name="ids[]"]').forEach(el => el.remove());
            
            checkedBoxes.forEach(cb => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'ids[]';
                input.value = cb.value;
                form.appendChild(input);
            });
            
            form.submit();
        }
    }

    function editRole(role) {
        document.getElementById('editRoleForm').action = "/settings/roles/" + role.id;
        document.getElementById('edit_name').value = role.name;
        
        // Reset checkboxes
        document.querySelectorAll('#edit_permissions_container input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Set checkboxes if permissions exist
        if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(perm => {
                const cb = document.getElementById('edit_perm_' + perm);
                if (cb) cb.checked = true;
            });
        }

        document.getElementById('editRoleModal').classList.remove('hidden');
    }

    function deleteRole(roleId) {
        if (confirm('Apakah Anda yakin ingin menghapus role ini? Pastikan tidak ada user yang menggunakan role ini.')) {
            const form = document.getElementById('deleteRoleForm');
            form.action = "/settings/roles/" + roleId;
            form.submit();
        }
    }
</script>
@endsection
