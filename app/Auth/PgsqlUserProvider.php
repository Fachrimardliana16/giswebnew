<?php

namespace App\Auth;

use App\Models\DatabaseUser;
use Exception;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use PDO;

/**
 * Provider autentikasi ke PostgreSQL eksternal (legacy).
 *
 * CATATAN KEAMANAN:
 *  - Password TIDAK pernah disimpan di session/storage.
 *  - Koneksi dibuka, kredensial diverifikasi dengan query nyata, lalu ditutup.
 *  - Host/port/db dibaca dari config, tanpa default IP di dalam kode.
 */
class PgsqlUserProvider implements UserProvider
{
    public function retrieveById($identifier)
    {
        return new DatabaseUser(['username' => $identifier]);
    }

    public function retrieveByToken($identifier, $token)
    {
        return null;
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        // tidak ada penyimpanan token pada provider ini
    }

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['username'])) {
            return null;
        }

        return new DatabaseUser(['username' => $credentials['username']]);
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $username = (string) ($credentials['username'] ?? '');
        $password = (string) ($credentials['password'] ?? '');

        if ($username === '' || $password === '') {
            return false;
        }

        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $dbname = config('database.connections.pgsql.database');

        if (! $host || ! $dbname) {
            return false;
        }

        try {
            $pdo = new PDO(
                "pgsql:host={$host};port={$port};dbname={$dbname}",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5,
                ]
            );

            // Connect sukses saja BUKAN bukti kredensial valid untuk aplikasi:
            // pastikan role bisa login, lalu tutup koneksi.
            $statement = $pdo->prepare('SELECT 1 FROM pg_roles WHERE rolname = :name AND rolcanlogin LIMIT 1');
            $statement->execute(['name' => $username]);
            $valid = (bool) $statement->fetchColumn();

            $statement = null;
            $pdo = null;

            return $valid;
        } catch (Exception $e) {
            return false;
        }
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        return false;
    }
}
