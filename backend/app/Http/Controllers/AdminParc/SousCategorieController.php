<?php
// app/Http/Controllers/AdminParc/SousCategorieController.php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Models\Dico\{SousCategorie, Categorie};
use App\Models\SousCategorieAttribute;
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Validator};

class SousCategorieController extends Controller
{
    /**
     * Types de champs valides — synchronisés avec FIELD_TYPES du frontend
     */
    const VALID_FIELD_TYPES = 'text,number,date,select,boolean,textarea,api_select';

    /**
     * Liste des sous-catégories avec leurs attributs
     */
    public function index(Request $request): JsonResponse
    {
        $query = SousCategorie::with(['categorie', 'attributes'])
            ->withCount('materiels');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $sousCategories = $query->orderBy('trie')->get();

        return response()->json($sousCategories);
    }

    /**
     * Détail d'une sous-catégorie avec ses attributs
     */
    public function show(int $id): JsonResponse
    {
        $sousCategorie = SousCategorie::with(['categorie', 'attributes'])
            ->withCount('materiels')
            ->findOrFail($id);

        return response()->json($sousCategorie);
    }

    /**
     * Créer une sous-catégorie avec ses attributs
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'category_id'              => 'required|exists:categories,id',
            'nom'                      => 'required|string|max:255|unique:sous_categories,nom',
            'trie'                     => 'nullable|integer',
            'attributes'               => 'nullable|array',
            'attributes.*.key'         => 'required|string|max:255',
            'attributes.*.label'       => 'required|string|max:255',
            'attributes.*.type'        => 'required|in:' . self::VALID_FIELD_TYPES,
            'attributes.*.options'     => 'nullable|array',
            'attributes.*.data_key'    => 'nullable|string',
            'attributes.*.label_field' => 'nullable|string',
            'attributes.*.value_field' => 'nullable|string',
            'attributes.*.required'    => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $sousCategorie = DB::transaction(function () use ($validated) {
            // Créer la sous-catégorie
            $sousCategorie = SousCategorie::create([
                'category_id' => $validated['category_id'],
                'nom'         => $validated['nom'],
                'trie'        => $validated['trie'] ?? 0,
            ]);

            // Ajouter les attributs
            if (!empty($validated['attributes'])) {
                foreach ($validated['attributes'] as $index => $attr) {
                    SousCategorieAttribute::create([
                        'sous_category_id' => $sousCategorie->id,
                        'key'              => $attr['key'],
                        'label'            => $attr['label'],
                        'type'             => $attr['type'],
                        'options'          => $attr['options'] ?? null,
                        'data_key'         => $attr['data_key'] ?? null,
                        'label_field'      => $attr['label_field'] ?? null,
                        'value_field'      => $attr['value_field'] ?? null,
                        'ordre'            => $index,
                        'required'         => $attr['required'] ?? false,
                    ]);
                }
            }

            AuditService::log('CREATE_SOUS_CATEGORIE', 'SousCategorie', $sousCategorie->id, null, $sousCategorie->toArray());

            return $sousCategorie;
        });

        $sousCategorie->load(['categorie', 'attributes']);

        return response()->json([
            'message' => 'Sous-catégorie créée avec succès.',
            'sous_categorie' => $sousCategorie,
        ], 201);
    }

    /**
     * Mettre à jour une sous-catégorie et ses attributs
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $sousCategorie = SousCategorie::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom'                      => 'sometimes|string|max:255|unique:sous_categories,nom,' . $id,
            'trie'                     => 'nullable|integer',
            'attributes'               => 'nullable|array',
            'attributes.*.key'         => 'required|string|max:255',
            'attributes.*.label'       => 'required|string|max:255',
            'attributes.*.type'        => 'required|in:' . self::VALID_FIELD_TYPES,
            'attributes.*.options'     => 'nullable|array',
            'attributes.*.data_key'    => 'nullable|string',
            'attributes.*.label_field' => 'nullable|string',
            'attributes.*.value_field' => 'nullable|string',
            'attributes.*.required'    => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        DB::transaction(function () use ($sousCategorie, $validated) {
            $before = $sousCategorie->toArray();

            // Mettre à jour la sous-catégorie
            if (isset($validated['nom'])) {
                $sousCategorie->nom = $validated['nom'];
            }
            if (isset($validated['trie'])) {
                $sousCategorie->trie = $validated['trie'];
            }
            $sousCategorie->save();

            // Mettre à jour les attributs si fournis
            if (array_key_exists('attributes', $validated)) {
                // Supprimer les anciens attributs
                $sousCategorie->attributes()->delete();

                // Créer les nouveaux
                if (!empty($validated['attributes'])) {
                    foreach ($validated['attributes'] as $index => $attr) {
                        SousCategorieAttribute::create([
                            'sous_category_id' => $sousCategorie->id,
                            'key'              => $attr['key'],
                            'label'            => $attr['label'],
                            'type'             => $attr['type'],
                            'options'          => $attr['options'] ?? null,
                            'data_key'         => $attr['data_key'] ?? null,
                            'label_field'      => $attr['label_field'] ?? null,
                            'value_field'      => $attr['value_field'] ?? null,
                            'ordre'            => $index,
                            'required'         => $attr['required'] ?? false,
                        ]);
                    }
                }
            }

            AuditService::log('UPDATE_SOUS_CATEGORIE', 'SousCategorie', $sousCategorie->id, $before, $sousCategorie->fresh()->toArray());
        });

        $sousCategorie->load(['categorie', 'attributes']);

        return response()->json([
            'message' => 'Sous-catégorie mise à jour.',
            'sous_categorie' => $sousCategorie,
        ]);
    }

    /**
     * Supprimer une sous-catégorie
     */
    public function destroy(int $id): JsonResponse
    {
        $sousCategorie = SousCategorie::withCount('materiels')->findOrFail($id);

        if ($sousCategorie->materiels_count > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer: cette sous-catégorie contient des matériels.',
            ], 422);
        }

        AuditService::log('DELETE_SOUS_CATEGORIE', 'SousCategorie', $sousCategorie->id, $sousCategorie->toArray());

        $sousCategorie->attributes()->delete();
        $sousCategorie->delete();

        return response()->json(['message' => 'Sous-catégorie supprimée.']);
    }
}