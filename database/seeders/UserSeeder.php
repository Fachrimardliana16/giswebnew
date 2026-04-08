<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Default Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $viewerRole = Role::firstOrCreate(['name' => 'viewer']);

        // 2. Extra Roles from images
        $extraRoles = [
            'role_c01', 'role_c02', 'role_c03', 'role_c04', 'role_c05', 'role_c06', 
            'role_c07', 'role_c08', 'role_gis_admin', 'role_gis_asesoris', 
            'role_gis_bangunan', 'role_gis_common', 'role_gis_hublang', 
            'role_gis_jasper', 'role_gis_perpipaan', 'role_gis_read', 
            'role_gis_talend', 'role_pusat'
        ];
        foreach ($extraRoles as $rName) {
            Role::firstOrCreate(['name' => $rName]);
        }

        // 3. Usernames from images
        $usernames = [
            'adi', 'adikpurwo', 'admin_crm', 'agung', 'aji', 'ajipurwanto', 'aldi', 'amin', 'anas', 'anggorobayu', 
            'ardilawet', 'ardin', 'aulia', 'ayudia', 'backadm', 'bobotsari', 'bukateja', 'cabangkota', 'candra', 
            'crm_admin', 'crm_aulia', 'crm_fachri', 'dika', 'eko', 'ekowidiarto', 'eli', 'endro', 'erdiono', 'esa', 
            'fachri', 'fadil', 'geoserve', 'geoserver', 'gesit', 'goentoer', 'grafana', 'hendro', 'ihsancp', 'iqbal', 
            'isti', 'janitra', 'jensoed', 'kemangkon', 'kholiq', 'kurnia', 'mapbender_adm', 'margono', 'maris', 
            'marisamrulah', 'maun', 'meirza', 'migration', 'moko', 'naufal', 'nia', 'nurkholis', 'pdamadmin', 
            'pg_checkpoint', 'pg_create_subscription', 'pg_database_owner', 'pg_execute_server_program', 
            'pg_maintain', 'pg_monitor', 'pg_read_all_data', 'pg_read_all_settings', 'pg_read_all_stats', 
            'pg_read_server_files', 'pg_signal_backend', 'pg_stat_scan_tables', 'pg_use_reserved_connections', 
            'pg_write_all_data', 'pg_write_server_files', 'postgres', 'rakhmanto', 'rakum', 'rembang', 'restu', 
            'rica', 'rizaldi', 'role_c01', 'role_c02', 'role_c03', 'role_c04', 'role_c05', 'role_c06', 'role_c07', 
            'role_c08', 'role_gis_admin', 'role_gis_asesoris', 'role_gis_bangunan', 'role_gis_common', 'role_gis_hublang', 
            'role_gis_jasper', 'role_gis_perpipaan', 'role_gis_read', 'role_gis_talend', 'role_pusat', 'santoso', 
            'satrio', 'sechan', 'setiawanaji', 'sopandi', 'subarman', 'sugeng', 'suherman', 'supandi', 'sutarman', 
            'sutikno', 'sutoyo', 'suyadi', 'suyitno', 'teguhk', 'teknik', 'triyono', 'tur', 'turcahyo', 'user', 
            'user01', 'user_talend', 'usmanjanatin', 'wagiman', 'wawan', 'wicak', 'widiasmoko', 'yani', 'yoga'
        ];

        foreach ($usernames as $username) {
            // Determine Role
            $roleObj = $userRole;
            if (in_array($username, ['fachri', 'kholiq', 'aulia', 'pdamadmin', 'postgres'])) {
                $roleObj = $adminRole;
            } elseif (str_starts_with($username, 'role_')) {
                $roleObj = Role::where('name', $username)->first() ?? $userRole;
            } elseif (str_starts_with($username, 'pg_')) {
                $roleObj = $viewerRole;
            }

            User::updateOrCreate(
                ['username' => $username],
                [
                    'name' => ucwords(str_replace(['_', '.'], ' ', $username)),
                    'password' => Hash::make('password'),
                    'role_id' => $roleObj->id,
                ]
            );
        }
    }
}
