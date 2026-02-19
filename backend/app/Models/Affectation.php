<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Affectation extends Model
{
    protected $fillable = [
        'materiel_id', 'service_id', 'user_id',
        'numero_inventaire', 'annee_inventaire', 'bon_sortie',
        'bon_sortie_pdf', 'nature', 'date_affectation', 'date_retour', 'status',
    ];

    protected $casts = [
        'date_affectation' => 'date',
        'date_retour'      => 'date',
    ];

    protected $appends = ['bon_sortie_pdf_url'];

    // ─── Accessors ──────────────────────────────────
    public function getBonSortiePdfUrlAttribute(): ?string
    {
        if (!$this->bon_sortie_pdf) {
            return null;
        }
        return Storage::disk('public')->url($this->bon_sortie_pdf);
    }

    // ─── Relations ──────────────────────────────────
    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ─────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    public function scopeReturned($query)
    {
        return $query->where('status', 'RETURNED');
    }

    // ─── Helpers ────────────────────────────────────
    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }
}