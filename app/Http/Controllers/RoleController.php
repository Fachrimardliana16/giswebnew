<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $sortBy = $request->get('sort', 'name');
        $order = $request->get('order', 'asc');

        if (!in_array($sortBy, ['name', 'created_at'])) {
            $sortBy = 'name';
        }

        if (!in_array($order, ['asc', 'desc'])) {
            $order = 'asc';
        }

        $roles = Role::withCount('users')->orderBy($sortBy, $order)->get();
        return view('dashboard.roles.index', compact('roles'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'permissions' => 'nullable|array',
        ]);

        Role::create($validated);

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'permissions' => 'nullable|array',
        ]);

        $role->update($validated);

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return back()->with('error', 'Role tidak dapat dihapus karena masih digunakan oleh user.');
        }

        $role->delete();
        return back()->with('success', 'Role berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'Tidak ada role yang dipilih.');
        }

        $roles = Role::whereIn('id', $ids)->withCount('users')->get();
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($roles as $role) {
            if ($role->users_count === 0) {
                $role->delete();
                $deletedCount++;
            } else {
                $skippedCount++;
            }
        }

        if ($deletedCount === 0 && $skippedCount > 0) {
            return back()->with('error', 'Tidak ada role yang dihapus karena semuanya masih digunakan oleh user.');
        }

        $message = "$deletedCount Role berhasil dihapus.";
        if ($skippedCount > 0) {
            $message .= " ($skippedCount Role dilewati karena masih memiliki user).";
        }

        return back()->with('success', $message);
    }
}
