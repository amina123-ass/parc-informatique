<?php

namespace Database\Seeders;

use App\Models\Dico\Marque;
use Illuminate\Database\Seeder;

class MarqueSeeder extends Seeder
{
    public function run(): void
    {
        $marques = ['HP', 'Dell', 'Lenovo', 'Canon', 'Epson', 'Cisco', 'APC'];

        foreach ($marques as $index => $nom) {
            Marque::updateOrCreate(
                ['nom' => $nom],
                ['nom' => $nom, 'trie' => $index + 1]
            );
        }

        $this->command->info('✅ Marques seedées : ' . count($marques));
    }
}