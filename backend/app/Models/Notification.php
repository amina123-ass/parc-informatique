<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'data', 'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    // ─── Relations ──────────────────────────────────
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ─────────────────────────────────────
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    // ─── Helpers ────────────────────────────────────
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }
}