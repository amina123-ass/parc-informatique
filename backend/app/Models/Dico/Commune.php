<?php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;

class Commune extends Model
{
    protected $fillable = ['nom', 'milieu', 'trie'];
}
