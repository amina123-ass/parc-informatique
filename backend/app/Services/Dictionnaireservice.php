<?php

namespace App\Services;

use App\Models\Dico\{Marque, Cartouche, Categorie, SousCategorie, Entite, Commune, Structure, SystemExploitation, TypeConnexion};
use Illuminate\Database\Eloquent\Model;

class DictionnaireService
{
    /**
     * Map URL type slug -> [model class, validation rules, label]
     */
    private static array $map = [
        'marques'              => [Marque::class,             ['nom' => 'required|string|max:255', 'trie' => 'nullable|integer']],
        'cartouches'           => [Cartouche::class,          ['couleur' => 'required|string|max:100', 'reference' => 'required|string|max:255', 'prix_unitaire' => 'required|numeric|min:0']],
        'categories'           => [Categorie::class,          ['nom' => 'required|string|max:255', 'trie' => 'nullable|integer']],
        'sous-categories'      => [SousCategorie::class,      ['category_id' => 'required|exists:categories,id', 'nom' => 'required|string|max:255', 'trie' => 'nullable|integer']],
        'entites'              => [Entite::class,             ['nom' => 'required|string|max:255', 'trie' => 'nullable|integer']],
        'communes'             => [Commune::class,            ['nom' => 'required|string|max:255', 'milieu' => 'nullable|string|max:100', 'trie' => 'nullable|integer']],
        'structures'           => [Structure::class,          ['nom' => 'required|string|max:255', 'trie' => 'nullable|integer']],
        'system-exploitations' => [SystemExploitation::class, ['nom' => 'required|string|max:255', 'version' => 'nullable|string|max:100', 'trie' => 'nullable|integer']],
        'type-connexions'      => [TypeConnexion::class,      ['nom' => 'required|string|max:255']],
    ];

    public static function getModelClass(string $type): ?string
    {
        return self::$map[$type][0] ?? null;
    }

    public static function getRules(string $type): array
    {
        return self::$map[$type][1] ?? [];
    }

    public static function getTypes(): array
    {
        return array_keys(self::$map);
    }

    public static function resolve(string $type): ?Model
    {
        $class = self::getModelClass($type);
        return $class ? new $class : null;
    }
}