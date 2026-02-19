<?php

namespace App\Http\Requests\AdminParc;

use Illuminate\Foundation\Http\FormRequest;

class StoreBesoinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'utilisateur_id' => 'required|exists:users,id',
            'service_id'     => 'required|exists:services,id',
            'entite_id'      => 'nullable|exists:entites,id',
            'type_besoin'    => 'required|in:PC,imprimante,cartouche,autre',
            'designation'    => 'required|string|max:255',
            'description'    => 'nullable|string',
            'date_demande'   => 'required|date',
            'priorite'       => 'required|in:faible,moyenne,urgente',
        ];
    }

    public function messages(): array
    {
        return [
            'utilisateur_id.required' => 'L\'utilisateur est obligatoire.',
            'service_id.required'     => 'Le service est obligatoire.',
            'type_besoin.required'    => 'Le type de besoin est obligatoire.',
            'type_besoin.in'          => 'Type invalide. Valeurs acceptées: PC, imprimante, cartouche, autre.',
            'designation.required'    => 'La désignation est obligatoire.',
            'date_demande.required'   => 'La date de demande est obligatoire.',
            'priorite.in'            => 'Priorité invalide. Valeurs: faible, moyenne, urgente.',
        ];
    }
}