<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SecurityQuestionOption;

class SecurityQuestionOptionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            'Quel est le nom de jeune fille de votre mère ?',

            // Enfance & souvenirs
            'Dans quelle ville avez-vous grandi ?',
            'Quel était le nom de votre école primaire ?',

            // Animaux & lieux
            'Quel était le nom de votre premier animal de compagnie ?',

            // Préférences personnelles
            'Quel est votre film préféré ?',


            // Événements mémorables
            'Dans quelle ville s\'est déroulé votre mariage ?',
            'Quelle est la destination de votre premier voyage à l\'étranger ?',
            'Quel est le modèle de votre première voiture ?',
            'Quel est le nom de votre premier professeur de collège ?',
        ];

        foreach ($questions as $question) {
            SecurityQuestionOption::firstOrCreate(
                ['question' => $question],
                ['active' => true]
            );
        }

        $this->command->info('✅ ' . count($questions) . ' questions de sécurité insérées avec succès.');
    }
}
