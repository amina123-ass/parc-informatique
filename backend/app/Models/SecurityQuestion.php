<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecurityQuestion extends Model
{
    protected $fillable = ['user_id', 'question', 'answer_hash'];

    protected $hidden = ['answer_hash'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}