<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class DatabaseUser extends Authenticatable
{
    protected $fillable = ['username'];
    public $timestamps = false;
    protected $primaryKey = 'username';
    public $incrementing = false;

    // We don't need a password stored here since we verify by connecting
    protected $hidden = ['password'];
}
