<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BesoinHistorique extends Model
{
    protected $fillable = [
        'besoin_id', 'ancien_statut', 'nouveau_statut',
        'commentaire', 'user_action_id', 'date_action',
    ];

    protected $casts = [
        'date_action' => 'datetime',
    ];

    // ─── Relations ──────────────────────────────────
    public function besoin()
    {
        return $this->belongsTo(Besoin::class);
    }

    public function userAction()
    {
        return $this->belongsTo(User::class, 'user_action_id');
    }
}