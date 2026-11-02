<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'admin']);
        $this->admin = User::create([
            'username' => 'admin_uji',
            'name' => 'Admin',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);
    }

    public function test_admin_membuat_user_baru(): void
    {
        $role = Role::firstOrFail();

        $this->actingAs($this->admin)->post('/settings/users', [
            'name' => 'Orang Baru',
            'username' => 'orangbaru',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['username' => 'orangbaru']);
    }

    public function test_password_di_hash_bukan_plaintext(): void
    {
        $role = Role::firstOrFail();

        $this->actingAs($this->admin)->post('/settings/users', [
            'username' => 'hashuji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);

        $user = User::where('username', 'hashuji')->firstOrFail();
        $this->assertNotSame('rahasia123', $user->password);
        $this->assertTrue(password_verify('rahasia123', $user->password));
    }

    public function test_validasi_password_minimal_8_karakter(): void
    {
        $role = Role::firstOrFail();

        $this->actingAs($this->admin)->post('/settings/users', [
            'username' => 'pendek',
            'password' => 'pendek',
            'role_id' => $role->id,
        ])->assertSessionHasErrors('password');

        $this->assertDatabaseMissing('users', ['username' => 'pendek']);
    }

    public function test_username_harus_unik(): void
    {
        $role = Role::firstOrFail();

        $this->actingAs($this->admin)->post('/settings/users', [
            'username' => 'admin_uji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ])->assertSessionHasErrors('username');
    }

    public function test_admin_tidak_bisa_menghapus_dirinya_sendiri(): void
    {
        $this->actingAs($this->admin)
            ->delete("/settings/users/{$this->admin->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_bulk_delete_mengabaikan_akun_sendiri(): void
    {
        $this->actingAs($this->admin)
            ->post('/settings/users/bulk-delete', ['ids' => [$this->admin->id]])
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_hapus_user_lain_berhasil(): void
    {
        $role = Role::firstOrFail();
        $korban = User::create([
            'username' => 'korban',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);

        $this->actingAs($this->admin)
            ->delete("/settings/users/{$korban->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $korban->id]);
    }

    public function test_admin_terakhir_tidak_bisa_dihapus(): void
    {
        // hanya ada satu admin (diri sendiri) -> hapus orang lain tak relevan,
        // tapi update role admin terakhir harus ditolak
        $roleUser = Role::create(['name' => 'user']);

        $this->actingAs($this->admin)->put("/settings/users/{$this->admin->id}", [
            'username' => 'admin_uji',
            'role_id' => $roleUser->id,
        ])->assertSessionHas('error');

        $this->assertDatabaseHas('users', [
            'id' => $this->admin->id,
            'role_id' => Role::where('name', 'admin')->value('id'),
        ]);
    }

    public function test_sort_tidak_bisa_diisi_kolom_berbahaya(): void
    {
        $this->actingAs($this->admin)
            ->get('/settings/users?sort=password&order=asc')
            ->assertOk();
    }

    public function test_pencarian_mengembalikan_hasil_sesuai(): void
    {
        $role = Role::firstOrFail();
        User::create(['username' => 'cari_ini', 'password' => 'rahasia123', 'role_id' => $role->id]);

        $response = $this->actingAs($this->admin)->get('/settings/users?search=cari_ini');
        $response->assertOk();
        $response->assertSee('cari_ini');
    }
}
