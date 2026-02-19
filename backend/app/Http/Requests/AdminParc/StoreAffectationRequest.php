<?php

namespace App\Http\Requests\AdminParc;

use Illuminate\Foundation\Http\FormRequest;

class StoreAffectationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'materiel_id'        => 'required|exists:materiels,id',
            'service_id'         => 'required|exists:services,id',
            'user_id'            => 'required|exists:users,id',
            'numero_inventaire'  => 'nullable|string|max:100',
            'annee_inventaire'   => 'nullable|integer|min:2000|max:2100',
            'bon_sortie'         => 'nullable|string|max:100',
            'nature'             => 'nullable|string|max:255',
            'date_affectation'   => 'required|date|before_or_equal:today',
        ];
    }
}