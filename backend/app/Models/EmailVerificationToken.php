<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerificationToken extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'token_hash', 'expires_at', 'created_at'];

    protected $casts = [
        'expires_at'  => 'datetime',
        'created_at'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}