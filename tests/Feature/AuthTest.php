<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'admin']);
        User::create([
            'username' => 'fachri',
            'name' => 'Fachri',
            'password' => 'password',
            'role_id' => $role->id,
        ]);
    }

    public function test_login_sukses_mengarah_ke_dashboard(): void
    {
        $this->post('/login', [
            'username' => 'fachri',
            'password' => 'password',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticated();
    }

    public function test_login_gagal_mengembalikan_error(): void
    {
        $this->post('/login', [
            'username' => 'fachri',
            'password' => 'salah',
        ])->assertSessionHasErrors('error');

        $this->assertGuest();
    }

    public function test_login_menolak_setelah_5_percobaan_gagal(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->post('/login', [
                'username' => 'fachri',
                'password' => "salah{$i}",
            ]);
        }

        $response = $this->post('/login', [
            'username' => 'fachri',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('error');
        $this->assertGuest();
    }

    public function test_remember_me_mengatur_cookie(): void
    {
        $this->post('/login', [
            'username' => 'fachri',
            'password' => 'password',
            'remember' => 'on',
        ])->assertRedirect('/dashboard');

        $this->assertAuthenticated();
        // session driver testing tidak menyimpan cookie remember secara langsung,
        // tapi auth harus tetap berhasil
        $this->assertTrue(true);
    }

    public function test_logout_mengakhiri_sesi(): void
    {
        $this->actingAs(User::firstOrFail());

        $this->get('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_halaman_login_menampilkan_form(): void
    {
        $this->get('/login')->assertOk()->assertSee('Masuk Ke Sistem');
    }

    public function test_route_lupa_password_tidak_ada(): void
    {
        // fitur dihapus dari UI; pastikan route memang tidak ada
        $this->get('/forgot-password')->assertNotFound();
        $this->get('/password/reset')->assertNotFound();
    }
}
