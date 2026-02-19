<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Dico\{TypeConnexion, Entite, Commune, Structure};
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // ── Récupérer les IDs dynamiquement ─────────────
        $fibre = TypeConnexion::where('nom', 'FIBRE')->first();
        $adsl  = TypeConnexion::where('nom', 'ADSL')->first();
        $lan   = TypeConnexion::where('nom', 'LAN')->first();
        $g4    = TypeConnexion::where('nom', '4G')->first();

        $dg         = Entite::where('nom', 'Direction Générale')->first();
        $si         = Entite::where('nom', 'Service Informatique')->first();
        $finance    = Entite::where('nom', 'Département Financier')->first();
        $logistique = Entite::where('nom', 'Département Logistique')->first();

        $casablanca = Commune::where('nom', 'Casablanca')->first();
        $rabat      = Commune::where('nom', 'Rabat')->first();
        $fes        = Commune::where('nom', 'Fès')->first();
        $sefrou     = Commune::where('nom', 'Sefrou')->first();
        $ifrane     = Commune::where('nom', 'Ifrane')->first();

        $centrale  = Structure::where('nom', 'Administration Centrale')->first();
        $regionale = Structure::where('nom', 'Annexe Régionale')->first();
        $locale    = Structure::where('nom', 'Agence Locale')->first();
        $technique = Structure::where('nom', 'Centre Technique')->first();

        // ── Services ────────────────────────────────────
        $services = [
            [
                'nom'               => 'SI Casablanca',
                'type_connexion_id' => $fibre->id,
                'entite_id'         => $si->id,
                'commune_id'        => $casablanca->id,
                'structure_id'      => $centrale->id,
            ],
            [
                'nom'               => 'SI Rabat',
                'type_connexion_id' => $fibre->id,
                'entite_id'         => $si->id,
                'commune_id'        => $rabat->id,
                'structure_id'      => $regionale->id,
            ],
            [
                'nom'               => 'SI Fès',
                'type_connexion_id' => $adsl->id,
                'entite_id'         => $si->id,
                'commune_id'        => $fes->id,
                'structure_id'      => $regionale->id,
            ],
            [
                'nom'               => 'Logistique Sefrou',
                'type_connexion_id' => $g4->id,
                'entite_id'         => $logistique->id,
                'commune_id'        => $sefrou->id,
                'structure_id'      => $locale->id,
            ],
            [
                'nom'               => 'Finance Ifrane',
                'type_connexion_id' => $lan->id,
                'entite_id'         => $finance->id,
                'commune_id'        => $ifrane->id,
                'structure_id'      => $technique->id,
            ],
        ];

        foreach ($services as $data) {
            Service::updateOrCreate(
                ['nom' => $data['nom']],
                [
                    'type_connexion_id' => $data['type_connexion_id'],
                    'entite_id'         => $data['entite_id'],
                    'commune_id'        => $data['commune_id'],
                    'structure_id'      => $data['structure_id'],
                ]
            );
        }

        $this->command->info('✅ Services seedés : ' . count($services));
    }
}