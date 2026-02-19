<?php

namespace Database\Seeders;

use App\Models\Dico\Structure;
use Illuminate\Database\Seeder;

class StructureSeeder extends Seeder
{
    public function run(): void
    {
        $structures = [
            'Administration Centrale',
            'Annexe Régionale',
            'Agence Locale',
            'Centre Technique',
        ];

        foreach ($structures as $index => $nom) {
            Structure::updateOrCreate(
                ['nom' => $nom],
                ['nom' => $nom, 'trie' => $index + 1]
            );
        }

        $this->command->info('✅ Structures seedées : ' . count($structures));
    }
}