<?php
// app/Http/Requests/AdminParc/StoreMaterielRequest.php

namespace App\Http\Requests\AdminParc;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterielRequest extends FormRequest
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
            'model' => 'required|string|max:255',
            'marque_id' => 'nullable|exists:marques,id',
            'category_id' => 'required|exists:categories,id',
            'sous_category_id' => 'required|exists:sous_categories,id',
            'date_achat' => 'required|date',
            'garantie_fin' => 'nullable|date|after_or_equal:date_achat',
            'observation' => 'nullable|string',
            'prix_unitaire' => 'required|numeric|min:0',
            'etat' => 'nullable|in:EN_STOCK,AFFECTE,PANNE,REFORME',
            'reseau' => 'nullable|boolean',
            
            // ✅ Accepter specs comme array (après décodage)
            'specs' => 'nullable|array',
            
            // Affectation
            'affectation' => 'nullable|array',
            'affectation.service_id' => 'required_with:affectation|exists:services,id',
            'affectation.user_id' => 'nullable|exists:users,id',
            'affectation.numero_inventaire' => 'nullable|string|max:100',
            'affectation.annee_inventaire' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'affectation.bon_sortie' => 'nullable|string|max:100',
            'affectation.nature' => 'nullable|string|max:255',
            'affectation.date_affectation' => 'required_with:affectation|date',
            
            'bon_sortie_pdf' => 'nullable|file|mimes:pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'model.required' => 'Le modèle est obligatoire.',
            'category_id.required' => 'La catégorie est obligatoire.',
            'category_id.exists' => 'La catégorie sélectionnée n\'existe pas.',
            'sous_category_id.required' => 'La sous-catégorie est obligatoire.',
            'sous_category_id.exists' => 'La sous-catégorie sélectionnée n\'existe pas.',
            'date_achat.required' => 'La date d\'achat est obligatoire.',
            'date_achat.date' => 'La date d\'achat doit être une date valide.',
            'prix_unitaire.required' => 'Le prix unitaire est obligatoire.',
            'prix_unitaire.numeric' => 'Le prix unitaire doit être un nombre.',
            'prix_unitaire.min' => 'Le prix unitaire doit être positif.',
            'affectation.service_id.required_with' => 'Le service est obligatoire pour l\'affectation.',
            'affectation.service_id.exists' => 'Le service sélectionné n\'existe pas.',
            'affectation.date_affectation.required_with' => 'La date d\'affectation est obligatoire.',
            'bon_sortie_pdf.mimes' => 'Le fichier doit être un PDF.',
            'bon_sortie_pdf.max' => 'Le fichier ne doit pas dépasser 5 Mo.',
        ];
    }
}