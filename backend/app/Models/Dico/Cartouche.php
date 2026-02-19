<?php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;

class Cartouche extends Model
{
    protected $fillable = ['couleur', 'reference', 'prix_unitaire'];

    protected $casts = ['prix_unitaire' => 'decimal:2'];
}
