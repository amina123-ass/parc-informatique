<?php

namespace Database\Seeders;

use App\Models\{User, Role, Service};
use App\Models\Dico\{Entite, Commune, Structure, TypeConnexion};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSISeeder extends Seeder
{
    public function run(): void
    {
        // ── Rôles ──────────────────────────────────
        $roleAdminSI = Role::firstOrCreate(['nom' => 'ADMIN_SI']);
        Role::firstOrCreate(['nom' => 'ADMIN_PARC']);

        // ── Dictionnaire de base ───────────────────
        $entite    = Entite::firstOrCreate(['nom' => 'Direction Régionale de la Santé']);
        $commune   = Commune::firstOrCreate(['nom' => 'Rabat', 'milieu' => 'Urbain']);
        $structure = Structure::firstOrCreate(['nom' => 'Service Informatique']);
        $typeCo    = TypeConnexion::firstOrCreate(['nom' => 'Fibre Optique']);

        // ── Service ────────────────────────────────
        $service = Service::firstOrCreate(
            ['nom' => 'Service Informatique - DRS'],
            [
                'type_connexion_id' => $typeCo->id,
                'commune_id'        => $commune->id,
                'entite_id'         => $entite->id,
                'structure_id'      => $structure->id,
            ]
        );

        // ── Admin SI User ──────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@parc-informatique.ma'],
            [
                'matricule'         => 'ADM001',
                'nom'               => 'Admin',
                'prenom'            => 'Système',
                'fonction'          => 'Administrateur SI',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
                'account_active'    => true,
                'role_id'           => $roleAdminSI->id,
                'service_id'        => $service->id,
            ]
        );

        $this->command->info('✅ AdminSI créé : admin@parc-informatique.ma / password');
    }
}