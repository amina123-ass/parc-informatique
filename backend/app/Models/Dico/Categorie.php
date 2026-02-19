<?php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $table = 'categories';
    protected $fillable = ['nom', 'trie'];

    public function sousCategories()
    {
        return $this->hasMany(SousCategorie::class, 'category_id');
    }
}
