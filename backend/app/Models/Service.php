<?php

namespace App\Models;

use App\Models\Dico\Commune;
use App\Models\Dico\Entite;
use App\Models\Dico\Structure;
use App\Models\Dico\TypeConnexion;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['nom', 'type_connexion_id', 'commune_id', 'entite_id', 'structure_id'];

    public function typeConnexion()
    {
        return $this->belongsTo(TypeConnexion::class);
    }

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function entite()
    {
        return $this->belongsTo(Entite::class);
    }

    public function structure()
    {
        return $this->belongsTo(Structure::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}