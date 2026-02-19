<?php

namespace Database\Seeders;

use App\Models\Dico\Categorie;
use Illuminate\Database\Seeder;

class CategorieSeeder extends Seeder
{
    public function run(): void
    {
        $categories = ['Informatique', 'Réseau', 'Impression', 'Sécurité'];

        foreach ($categories as $index => $nom) {
            Categorie::updateOrCreate(
                ['nom' => $nom],
                ['nom' => $nom, 'trie' => $index + 1]
            );
        }

        $this->command->info('✅ Catégories seedées : ' . count($categories));
    }
}