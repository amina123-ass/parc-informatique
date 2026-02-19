<?php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;

class TypeConnexion extends Model
{
    protected $table = 'type_connexions';
    protected $fillable = ['nom'];
}