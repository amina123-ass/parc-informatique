<?php
// app/Http/Requests/AdminParc/UpdateMaterielRequest.php

namespace App\Http\Requests\AdminParc;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterielRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Préparer les données avant validation
     */
    protected function prepareForValidation()
    {
        // ✅ Décoder specs si c'est une string JSON
        if ($this->has('specs') && is_string($this->specs)) {
            $decoded = json_decode($this->specs, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['specs' => $decoded]);
            }
        }

        // Convertir reseau en boolean
        if ($this->has('reseau')) {
            $this->merge([
                'reseau' => filter_var($this->reseau, FILTER_VALIDATE_BOOLEAN)
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'model' => 'sometimes|string|max:255',
            'marque_id' => 'nullable|exists:marques,id',
            'category_id' => 'sometimes|exists:categories,id',
            'sous_category_id' => 'sometimes|exists:sous_categories,id',
            'date_achat' => 'sometimes|date',
            'garantie_fin' => 'nullable|date|after_or_equal:date_achat',
            'observation' => 'nullable|string',
            'prix_unitaire' => 'sometimes|numeric|min:0',
            'etat' => 'sometimes|in:EN_STOCK,AFFECTE,PANNE,REFORME',
            'reseau' => 'nullable|boolean',
            'specs' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'model.string' => 'Le modèle doit être une chaîne de caractères.',
            'category_id.exists' => 'La catégorie sélectionnée n\'existe pas.',
            'sous_category_id.exists' => 'La sous-catégorie sélectionnée n\'existe pas.',
            'date_achat.date' => 'La date d\'achat doit être une date valide.',
            'prix_unitaire.numeric' => 'Le prix unitaire doit être un nombre.',
            'prix_unitaire.min' => 'Le prix unitaire doit être positif.',
        ];
    }
}