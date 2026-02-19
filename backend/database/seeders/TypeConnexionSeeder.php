<?php

namespace Database\Seeders;

use App\Models\Dico\TypeConnexion;
use Illuminate\Database\Seeder;

class TypeConnexionSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['FIBRE', 'ADSL', '4G', '5G', 'LAN', 'WIFI'];

        foreach ($types as $index => $nom) {
            TypeConnexion::updateOrCreate(
                ['nom' => $nom],
                ['nom' => $nom]
            );
        }

        $this->command->info('✅ TypeConnexions seedées : ' . count($types));
    }
}