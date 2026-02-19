<?php

namespace Database\Seeders;

use App\Models\Dico\Categorie;
use App\Models\Dico\SousCategorie;
use Illuminate\Database\Seeder;

class SousCategorieSeeder extends Seeder
{
    public function run(): void
    {
        $informatique = Categorie::where('nom', 'Informatique')->first();
        $reseau       = Categorie::where('nom', 'Réseau')->first();
        $impression   = Categorie::where('nom', 'Impression')->first();
        $securite     = Categorie::where('nom', 'Sécurité')->first();

        $sousCategories = [
            // Informatique
            ['category_id' => $informatique->id, 'nom' => 'PC Portable', 'trie' => 1],
            ['category_id' => $informatique->id, 'nom' => 'PC Bureau',   'trie' => 2],
            ['category_id' => $informatique->id, 'nom' => 'PC Serveur',  'trie' => 3],

            // Impression
            ['category_id' => $impression->id, 'nom' => 'Imprimante', 'trie' => 1],
            ['category_id' => $impression->id, 'nom' => 'Scanner',    'trie' => 2],
            ['category_id' => $impression->id, 'nom' => 'Fax',        'trie' => 3],

            // Réseau
            ['category_id' => $reseau->id, 'nom' => 'Point d\'accès', 'trie' => 1],
            ['category_id' => $reseau->id, 'nom' => 'Switch',         'trie' => 2],
            ['category_id' => $reseau->id, 'nom' => 'Routeur',        'trie' => 3],

            // Sécurité
            ['category_id' => $securite->id, 'nom' => 'Onduleur', 'trie' => 1],
            ['category_id' => $securite->id, 'nom' => 'Caméra',   'trie' => 2],
            ['category_id' => $securite->id, 'nom' => 'Autres',   'trie' => 3],
        ];

        foreach ($sousCategories as $data) {
            SousCategorie::updateOrCreate(
                ['category_id' => $data['category_id'], 'nom' => $data['nom']],
                ['trie' => $data['trie']]
            );
        }

        $this->command->info('✅ Sous-catégories seedées : ' . count($sousCategories));
    }
}