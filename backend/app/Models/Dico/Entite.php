<?php
// app/Models/Dico/Entite.php

namespace App\Models\Dico;

use Illuminate\Database\Eloquent\Model;
use App\Models\{Service, User};

class Entite extends Model
{
    protected $fillable = ['nom', 'code', 'trie'];

    /**
     * Relation avec les services
     */
    public function services()
    {
        return $this->hasMany(Service::class, 'entite_id');
    }

    /**
     * Relation avec les utilisateurs
     */
    public function users()
    {
        return $this->hasMany(User::class, 'entite_id');
    }
}