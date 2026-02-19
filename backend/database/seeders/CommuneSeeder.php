<?php

namespace Database\Seeders;

use App\Models\Dico\Commune;
use Illuminate\Database\Seeder;

class CommuneSeeder extends Seeder
{
    public function run(): void
    {
        $communes = [
            ['nom' => 'Casablanca', 'milieu' => 'Urbain'],
            ['nom' => 'Rabat',      'milieu' => 'Urbain'],
            ['nom' => 'Fès',        'milieu' => 'Urbain'],
            ['nom' => 'Sefrou',     'milieu' => 'Urbain'],
            ['nom' => 'Azrou',      'milieu' => 'Rural'],
            ['nom' => 'Ifrane',     'milieu' => 'Rural'],
        ];

        foreach ($communes as $index => $data) {
            Commune::updateOrCreate(
                ['nom' => $data['nom']],
                ['milieu' => $data['milieu'], 'trie' => $index + 1]
            );
        }

        $this->command->info('✅ Communes seedées : ' . count($communes));
    }
}