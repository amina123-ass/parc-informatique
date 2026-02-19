<?php
// app/Models/Dico/SousCategorie.php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;
use App\Models\SousCategorieAttribute;

class SousCategorie extends Model
{
    protected $fillable = ['category_id', 'nom', 'trie'];

    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'category_id');
    }

    public function materiels()
    {
        return $this->hasMany(\App\Models\Materiel::class, 'sous_category_id');
    }

    public function attributes()
    {
        return $this->hasMany(SousCategorieAttribute::class, 'sous_category_id')->orderBy('ordre');
    }
}