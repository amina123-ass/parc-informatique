<?php
// app/Models/SousCategorieAttribute.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SousCategorieAttribute extends Model
{
    protected $fillable = [
        'sous_category_id',
        'key',
        'label',
        'type',
        'options',
        'data_key',
        'label_field',
        'value_field',
        'ordre',
        'required',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
    ];

    public function sousCategorie()
    {
        return $this->belongsTo(SousCategorie::class, 'sous_category_id');
    }
}