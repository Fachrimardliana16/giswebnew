<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('username', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%');
            });
        }

        $sortBy = $request->get('sort', 'name');
        $order = $request->get('order', 'asc');
        
        // Validate sort columns to prevent SQL injection
        if (!in_array($sortBy, ['name', 'username', 'created_at'])) {
            $sortBy = 'name';
        }
        
        if (!in_array($order, ['asc', 'desc'])) {
            $order = 'asc';
        }

        $users = $query->orderBy($sortBy, $order)->paginate(15);
        $roles = Role::all();

        return view('dashboard.users.index', compact('users', 'roles'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role_id' => 'required|exists:roles,id',
            'password' => 'nullable|string|min:6',
        ]);

        $data = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'role_id' => $validated['role_id'],
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        // Avoid self-deletion if needed, but for now simple delete
        $user->delete();
        return back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return back()->with('error', 'Tidak ada user yang dipilih.');
        }

        // Security: Don't delete current user or predefined admins
        $protectedUsernames = ['fachri', 'kholiq', 'aulia'];
        $currentUser = auth()->user();

        $usersToDelete = User::whereIn('id', $ids)
            ->where('id', '!=', $currentUser->id)
            ->whereNotIn('username', $protectedUsernames)
            ->get();

        $count = $usersToDelete->count();
        
        foreach ($usersToDelete as $user) {
            $user->delete();
        }

        if ($count === 0) {
            return back()->with('error', 'Tidak ada user yang dapat dihapus (User dilindungi atau Anda sendiri).');
        }

        return back()->with('success', "$count User berhasil dihapus secara massal.");
    }
}
