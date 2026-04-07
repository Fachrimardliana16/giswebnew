<?php

namespace App\Auth;

use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use App\Models\DatabaseUser;
use PDO;
use Exception;

class PgsqlUserProvider implements UserProvider
{
    public function retrieveById($identifier)
    {
        return new DatabaseUser(['username' => $identifier]);
    }

    public function retrieveByToken($identifier, $token) { return null; }
    public function updateRememberToken(Authenticatable $user, $token) {}

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['username'])) {
            return null;
        }
        return new DatabaseUser(['username' => $credentials['username']]);
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        $username = $credentials['username'];
        $password = $credentials['password'];

        try {
            $host = env('DB_HOST', '36.93.220.245');
            $port = env('DB_PORT', '9191');
            $dbname = env('DB_DATABASE', 'gistirtaperwira2025');
            
            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);
            
            // Store credentials in session for future use if needed (not ideal for security, but matching legacy)
            session(['pgsql_user' => $username, 'pgsql_pass' => $password]);
            
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false) { return false; }
}
