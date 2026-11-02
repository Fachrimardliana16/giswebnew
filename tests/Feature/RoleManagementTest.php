<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
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

    private function userDenganRole(Role $role): User
    {
        static $n = 0;
        $n++;

        return User::create([
            'username' => 'user_'.$role->id.'_'.$n,
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);
    }

    public function test_admin_bisa_melihat_daftar_role(): void
    {
        Role::create(['name' => 'operator']);
        Role::create(['name' => 'viewer']);

        $this->actingAs($this->admin)
            ->get('/settings/roles')
            ->assertOk()
            ->assertSee('operator')
            ->assertSee('viewer');
    }

    public function test_non_admin_ditolak(): void
    {
        $role = Role::create(['name' => 'user']);
        $user = $this->userDenganRole($role);

        $this->actingAs($user)->get('/settings/roles')->assertRedirect('/dashboard');
        $this->actingAs($user)->post('/settings/roles', ['name' => 'hacker'])->assertRedirect('/dashboard');
        $this->assertDatabaseMissing('roles', ['name' => 'hacker']);
    }

    public function test_membuat_role_baru_dengan_permission(): void
    {
        $this->actingAs($this->admin)->post('/settings/roles', [
            'name' => 'operator_lapangan',
            'permissions' => ['filter_pelanggan', 'monitoring_pengaduan'],
        ])->assertSessionHas('success');

        $role = Role::where('name', 'operator_lapangan')->first();
        $this->assertNotNull($role);
        $this->assertSame(['filter_pelanggan', 'monitoring_pengaduan'], $role->permissions);
    }

    public function test_nama_role_harus_unik(): void
    {
        Role::create(['name' => 'operator']);

        $this->actingAs($this->admin)->post('/settings/roles', [
            'name' => 'operator',
        ])->assertSessionHasErrors('name');
    }

    public function test_nama_role_wajib_diisi(): void
    {
        $this->actingAs($this->admin)->post('/settings/roles', [
            'name' => '',
        ])->assertSessionHasErrors('name');
    }

    public function test_permission_tersimpan_sebagai_array(): void
    {
        $this->actingAs($this->admin)->post('/settings/roles', [
            'name' => 'gis_admin',
            'permissions' => ['manajemen_user', 'manajemen_role'],
        ]);

        $role = Role::where('name', 'gis_admin')->firstOrFail();
        $this->assertIsArray($role->permissions);
        $this->assertContains('manajemen_user', $role->permissions);
    }

    public function test_mengubah_role(): void
    {
        $role = Role::create(['name' => 'operator', 'permissions' => ['filter_pelanggan']]);

        $this->actingAs($this->admin)->put("/settings/roles/{$role->id}", [
            'name' => 'operator_baru',
            'permissions' => ['filter_pipa'],
        ])->assertSessionHas('success');

        $role->refresh();
        $this->assertSame('operator_baru', $role->name);
        $this->assertSame(['filter_pipa'], $role->permissions);
    }

    public function test_ubah_nama_ke_nama_lain_yang_sudah_ada_ditolak(): void
    {
        Role::create(['name' => 'operator']);
        $role = Role::create(['name' => 'viewer']);

        $this->actingAs($this->admin)->put("/settings/roles/{$role->id}", [
            'name' => 'operator',
        ])->assertSessionHasErrors('name');
    }

    public function test_tidak_bisa_menghapus_role_yang_masih_dipakai(): void
    {
        $role = Role::create(['name' => 'operator']);
        $this->userDenganRole($role);

        $this->actingAs($this->admin)
            ->delete("/settings/roles/{$role->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }

    public function test_bisa_menghapus_role_tanpa_user(): void
    {
        $role = Role::create(['name' => 'kosong']);

        $this->actingAs($this->admin)
            ->delete("/settings/roles/{$role->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_bulk_delete_melewati_role_yang_dipakai(): void
    {
        $dipakai = Role::create(['name' => 'dipakai']);
        $this->userDenganRole($dipakai);
        $kosong1 = Role::create(['name' => 'kosong1']);
        $kosong2 = Role::create(['name' => 'kosong2']);

        $this->actingAs($this->admin)->post('/settings/roles/bulk-delete', [
            'ids' => [$dipakai->id, $kosong1->id, $kosong2->id],
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('roles', ['id' => $dipakai->id]);
        $this->assertDatabaseMissing('roles', ['id' => $kosong1->id]);
        $this->assertDatabaseMissing('roles', ['id' => $kosong2->id]);
    }

    public function test_bulk_delete_tanpa_pilihan_memberi_error(): void
    {
        $this->actingAs($this->admin)
            ->post('/settings/roles/bulk-delete', ['ids' => []])
            ->assertSessionHasErrors('ids');
    }

    public function test_sort_tidak_bisa_diisi_kolom_berbahaya(): void
    {
        $this->actingAs($this->admin)
            ->get('/settings/roles?sort=permissions&order=asc')
            ->assertOk();
    }

    public function test_jumlah_user_dihitung_benar(): void
    {
        $role = Role::create(['name' => 'operator']);
        $this->userDenganRole($role);
        $this->userDenganRole($role);

        $response = $this->actingAs($this->admin)->get('/settings/roles');
        $response->assertOk();

        $role = Role::where('name', 'operator')->withCount('users')->first();
        $this->assertSame(2, $role->users_count);
    }

    public function test_role_dengan_permission_manajemen_user_dianggap_admin(): void
    {
        $role = Role::create([
            'name' => 'koordinator',
            'permissions' => ['manajemen_user'],
        ]);
        $user = $this->userDenganRole($role);

        $this->assertTrue($user->isAdmin());
        $this->actingAs($user)->get('/settings/users')->assertOk();
    }

    public function test_role_tanpa_permission_bukan_admin(): void
    {
        $role = Role::create(['name' => 'staf', 'permissions' => ['filter_pelanggan']]);
        $user = $this->userDenganRole($role);

        $this->assertFalse($user->isAdmin());
        $this->actingAs($user)->get('/settings/users')->assertRedirect('/dashboard');
    }
}
