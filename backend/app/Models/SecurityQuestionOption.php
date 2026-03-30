<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecurityQuestionOption extends Model
{
    protected $fillable = ['question', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
