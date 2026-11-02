<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $role = Role::create(['name' => 'admin']);

        return User::create([
            'username' => 'admin_uji',
            'name' => 'Admin Uji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);
    }

    private function regularUser(): User
    {
        $role = Role::create(['name' => 'user']);

        return User::create([
            'username' => 'user_biasa',
            'name' => 'User Biasa',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/settings/users')->assertRedirect('/login');
        $this->get('/settings/roles')->assertRedirect('/login');
        $this->get('/geo-proxy')->assertRedirect('/login');
    }

    public function test_non_admin_ditolak_dari_panel_admin(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user)->get('/settings/users')->assertRedirect('/dashboard');
        $this->actingAs($user)->get('/settings/roles')->assertRedirect('/dashboard');
    }

    public function test_non_admin_tidak_bisa_membuat_user(): void
    {
        $user = $this->regularUser();
        $admin = $this->admin();

        $this->actingAs($user)->post('/settings/users', [
            'username' => 'penyusup',
            'password' => 'rahasia123',
            'role_id' => $admin->role_id,
        ])->assertRedirect('/dashboard');

        $this->assertDatabaseMissing('users', ['username' => 'penyusup']);
        $this->assertSame(1, User::where('username', 'user_biasa')->count());
    }

    public function test_non_admin_tidak_bisa_menghapus_user(): void
    {
        $user = $this->regularUser();
        $admin = $this->admin();

        $this->actingAs($user)->delete("/settings/users/{$admin->id}")
            ->assertRedirect('/dashboard');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_bisa_membuka_panel(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/settings/users')->assertOk();
        $this->actingAs($admin)->get('/settings/roles')->assertOk();
        $this->actingAs($admin)->get('/dashboard')->assertOk();
    }

    public function test_role_ber_permission_manajemen_user_dianggap_admin(): void
    {
        $role = Role::create([
            'name' => 'operator',
            'permissions' => ['manajemen_user'],
        ]);
        $operator = User::create([
            'username' => 'operator_uji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);

        $this->assertTrue($operator->isAdmin());
        $this->actingAs($operator)->get('/settings/users')->assertOk();
    }

    public function test_role_tanpa_permission_bukan_admin(): void
    {
        $role = Role::create(['name' => 'viewer', 'permissions' => ['filter_pelanggan']]);
        $viewer = User::create([
            'username' => 'viewer_uji',
            'password' => 'rahasia123',
            'role_id' => $role->id,
        ]);

        $this->assertFalse($viewer->isAdmin());
        $this->assertTrue($viewer->hasPermission('filter_pelanggan'));
        $this->assertFalse($viewer->hasPermission('manajemen_user'));
    }

    public function test_user_tanpa_role_bukan_admin(): void
    {
        $tanpaRole = User::create([
            'username' => 'tanpa_role',
            'password' => 'rahasia123',
            'role_id' => null,
        ]);

        $this->assertFalse($tanpaRole->isAdmin());
        $this->actingAs($tanpaRole)->get('/settings/users')->assertRedirect('/dashboard');
    }
}
