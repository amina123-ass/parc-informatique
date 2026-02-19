<?php

namespace App\Models;

use App\Models\Dico\Categorie;
use App\Models\Dico\Marque;
use App\Models\Dico\SousCategorie;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Materiel extends Model
{
    use SoftDeletes;

    protected $table = 'materiels';

    protected $fillable = [
        'category_id', 'sous_category_id', 'marque_id', 'model',
        'date_achat', 'garantie_fin', 'observation', 'prix_unitaire',
        'etat', 'reseau', 'date_reforme',
    ];

    protected $casts = [
        'date_achat'     => 'date',
        'garantie_fin'   => 'date',
        'date_reforme'   => 'date',
        'prix_unitaire'  => 'decimal:2',
        'reseau'         => 'boolean',
    ];

    // ─── Relations ──────────────────────────────────
    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'category_id');
    }

    public function sousCategorie()
    {
        return $this->belongsTo(SousCategorie::class, 'sous_category_id');
    }

    public function marque()
    {
        return $this->belongsTo(Marque::class);
    }

    public function details()
    {
        return $this->hasMany(MaterielDetail::class);
    }

    public function affectations()
    {
        return $this->hasMany(Affectation::class);
    }

    public function affectationActive()
    {
        return $this->hasOne(Affectation::class)->where('status', 'ACTIVE');
    }

    // ─── Helpers ────────────────────────────────────
    public function isAffecte(): bool
    {
        return $this->etat === 'AFFECTE';
    }

    public function isReforme(): bool
    {
        return $this->etat === 'REFORME';
    }

    public function hasActiveAffectation(): bool
    {
        return $this->affectations()->where('status', 'ACTIVE')->exists();
    }

    /**
     * Retourne les specs sous forme clé => valeur
     */
    public function getSpecsAttribute(): array
    {
        return $this->details->pluck('value', 'key')->toArray();
    }
}