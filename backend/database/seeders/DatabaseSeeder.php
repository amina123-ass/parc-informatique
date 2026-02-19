<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1. Dictionnaire (tables sans FK d'abord)
            TypeConnexionSeeder::class,
            EntiteSeeder::class,
            CommuneSeeder::class,
            StructureSeeder::class,
            MarqueSeeder::class,
            CartoucheSeeder::class,

            // 2. Catégories puis sous-catégories (FK: category_id)
            CategorieSeeder::class,
            SousCategorieSeeder::class,

            // 3. Services (FK: type_connexion_id, entite_id, commune_id, structure_id)
            ServiceSeeder::class,
            SousCategorieAttributesSeeder :: class,
            // 4. Admin SI (FK: role_id, service_id)
            AdminSISeeder::class,
        ]);
    }
}