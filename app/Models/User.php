<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Role yang dianggap punya akses penuh ke panel admin.
     */
    public const ADMIN_ROLE = 'admin';

    /**
     * Permission yang membuka panel admin meski role bukan 'admin'.
     */
    public const ADMIN_PERMISSIONS = ['manajemen_user', 'manajemen_role'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role_id',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Apakah user boleh mengakses panel admin.
     *
     * Sumber kebenaran tunggal: relasi role + kolom permissions.
     * Tidak ada lagi daftar username hardcoded.
     */
    public function isAdmin(): bool
    {
        $role = $this->role;

        if (! $role) {
            return false;
        }

        if ($role->name === self::ADMIN_ROLE) {
            return true;
        }

        return (bool) array_intersect(self::ADMIN_PERMISSIONS, $role->permissions ?? []);
    }

    /**
     * Cek satu permission pada role user.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($permission, $this->role?->permissions ?? [], true);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
