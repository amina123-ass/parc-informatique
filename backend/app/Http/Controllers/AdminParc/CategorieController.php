<?php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Models\Dico\{Categorie, SousCategorie};
use Illuminate\Http\JsonResponse;

class CategorieController extends Controller
{
    /**
     * Toutes les catégories avec count matériels
     */
    public function index(): JsonResponse
    {
        $categories = Categorie::withCount(['sousCategories'])
            ->with(['sousCategories' => function ($q) {
                $q->withCount('materiels')->orderBy('trie');
            }])
            ->orderBy('trie')
            ->get();

        return response()->json($categories);
    }

    /**
     * Sous-catégories d'une catégorie
     */
    public function subCategories(int $categoryId): JsonResponse
{
    $category = Categorie::findOrFail($categoryId);

    $subCategories = SousCategorie::where('category_id', $categoryId)
        ->with('attributes') // Ajouter cette ligne
        ->withCount('materiels')
        ->orderBy('trie')
        ->get();

    return response()->json([
        'category'       => $category,
        'sub_categories' => $subCategories,
    ]);
}

    /**
     * Détail sous-catégorie
     */
    public function showSubCategory(int $subCategoryId): JsonResponse
{
    $sub = SousCategorie::with(['categorie', 'attributes']) // Modifier cette ligne
        ->withCount('materiels')
        ->findOrFail($subCategoryId);

    return response()->json($sub);
}
}