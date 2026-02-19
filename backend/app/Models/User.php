<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Dico\Entite;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $fillable = [
        'matricule', 
        'nom', 
        'prenom', 
        'email', 
        'fonction',
        'password', 
        'email_verified_at', 
        'account_active',
        'role_id', 
        'service_id',
        'entite_id', // ← AJOUTER CETTE LIGNE
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'account_active'    => 'boolean',
    ];

    // ─── JWT ────────────────────────────────────────
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role?->nom,
        ];
    }

    // ─── Relations ──────────────────────────────────
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // ← AJOUTER CETTE RELATION
    public function entite()
    {
        return $this->belongsTo(Entite::class, 'entite_id');
    }

    public function securityQuestions()
    {
        return $this->hasMany(SecurityQuestion::class);
    }

    public function affectations()
    {
        return $this->hasMany(Affectation::class, 'user_id');
    }

    // ─── Helpers ────────────────────────────────────
    public function isAdminSI(): bool
    {
        return $this->role?->nom === 'ADMIN_SI';
    }

    public function isFullyActivated(): bool
    {
        return $this->email_verified_at !== null
            && $this->account_active
            && $this->role_id !== null
            && $this->service_id !== null;
    }
}