<?php

namespace Database\Seeders;

use App\Models\Dico\Entite;
use Illuminate\Database\Seeder;

class EntiteSeeder extends Seeder
{
    public function run(): void
    {
        $entites = [
            'Direction Générale',
            'Service Informatique',
            'Département Financier',
            'Département Logistique',
        ];

        foreach ($entites as $index => $nom) {
            Entite::updateOrCreate(
                ['nom' => $nom],
                ['nom' => $nom, 'trie' => $index + 1]
            );
        }

        $this->command->info('✅ Entités seedées : ' . count($entites));
    }
}