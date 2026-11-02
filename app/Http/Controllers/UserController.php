<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            $search = str_replace(['%', '_'], ['\%', '\_'], (string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort', 'name');
        $order = $request->get('order', 'asc');

        if (! in_array($sortBy, ['name', 'username', 'created_at'], true)) {
            $sortBy = 'name';
        }

        if (! in_array($order, ['asc', 'desc'], true)) {
            $order = 'asc';
        }

        $users = $query->orderBy($sortBy, $order)->paginate(15)->withQueryString();
        $roles = Role::orderBy('name')->get();

        return view('dashboard.users.index', compact('users', 'roles'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
        ]);

        User::create([
            'name' => $validated['name'] ?? null,
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
            'password' => 'nullable|string|min:8',
        ]);

        // Jangan biarkan admin mencabut hak admin terakhir di sistem.
        if ((int) $validated['role_id'] !== (int) $user->role_id && $this->isLastAdmin($user)) {
            return back()->with('error', 'Tidak dapat mengubah role admin terakhir.');
        }

        $data = [
            'name' => $validated['name'] ?? null,
            'username' => $validated['username'],
            'role_id' => $validated['role_id'],
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($this->isSelf($user)) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        if ($this->isLastAdmin($user)) {
            return back()->with('error', 'Tidak dapat menghapus admin terakhir.');
        }

        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ])['ids'];

        $currentUser = $request->user();

        $usersToDelete = User::whereIn('id', $ids)
            ->whereKeyNot($currentUser->getKey())
            ->get()
            ->reject(fn (User $user) => $this->isLastAdmin($user));

        $count = $usersToDelete->count();

        foreach ($usersToDelete as $user) {
            $user->delete();
        }

        if ($count === 0) {
            return back()->with('error', 'Tidak ada user yang dapat dihapus (akun sendiri atau admin terakhir).');
        }

        return back()->with('success', "{$count} User berhasil dihapus secara massal.");
    }

    private function isSelf(User $user): bool
    {
        return Auth::id() === $user->getKey();
    }

    private function isLastAdmin(User $user): bool
    {
        if (! $user->isAdmin()) {
            return false;
        }

        return User::whereHas('role', fn ($q) => $q->where('name', 'admin'))
            ->whereKeyNot($user->getKey())
            ->doesntExist();
    }
}
