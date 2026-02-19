<?php

namespace App\Http\Requests\AdminParc;

use Illuminate\Foundation\Http\FormRequest;

class QuickCreateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'matricule'  => 'required|string|max:50|unique:users,matricule',
            'nom'        => 'required|string|max:100',
            'prenom'     => 'required|string|max:100',
            'service_id' => 'required|exists:services,id',
        ];
    }
}