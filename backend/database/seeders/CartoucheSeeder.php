<?php

namespace Database\Seeders;

use App\Models\Dico\Cartouche;
use Illuminate\Database\Seeder;

class CartoucheSeeder extends Seeder
{
    public function run(): void
    {
        $cartouches = [
            ['couleur' => 'Noir',    'reference' => 'HP-85A',     'prix_unitaire' => 350.00],
            ['couleur' => 'Couleur', 'reference' => 'CANON-445',  'prix_unitaire' => 250.00],
            ['couleur' => 'Noir',    'reference' => 'EPSON-T664', 'prix_unitaire' => 180.00],
        ];

        foreach ($cartouches as $data) {
            Cartouche::updateOrCreate(
                ['reference' => $data['reference']],
                ['couleur' => $data['couleur'], 'prix_unitaire' => $data['prix_unitaire']]
            );
        }

        $this->command->info('✅ Cartouches seedées : ' . count($cartouches));
    }
}