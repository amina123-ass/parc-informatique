<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterielDetail extends Model
{
    protected $table = 'materiel_details';

    protected $fillable = ['materiel_id', 'key', 'value'];

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }
}