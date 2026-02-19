<?php
// app/Http/Controllers/User/DashboardUserController.php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\{Affectation, Besoin, Panne};
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DashboardUserController extends Controller
{
    public function index(): JsonResponse
    {
        $userId = Auth::id();

        // Matériels affectés (affectations actives = date_retour null)
        $materielAffecte = Affectation::where('user_id', $userId)
            ->whereNull('date_retour')
            ->count();

        // Besoins (utilise utilisateur_id)
        $besoinsEnAttente = Besoin::where('utilisateur_id', $userId)
            ->where('statut', 'en_attente')
            ->count();

        $besoinsValides = Besoin::where('utilisateur_id', $userId)
            ->where('statut', 'valide')
            ->count();

        // Pannes déclarées
        $pannesDeclarees = Panne::where('user_declarant_id', $userId)
            ->where('statut', 'declaree')
            ->count();

        // Pannes en cours
        $pannesEnCours = Panne::where('user_declarant_id', $userId)
            ->where('statut', 'en_cours')
            ->count();

        // Pannes résolues
        $pannesResolues = Panne::where('user_declarant_id', $userId)
            ->where('statut', 'resolue')
            ->count();

        // Dernières affectations (actives uniquement)
        $dernieresAffectations = Affectation::where('user_id', $userId)
            ->whereNull('date_retour')
            ->with(['materiel.marque', 'materiel.sousCategorie', 'service'])
            ->orderBy('date_affectation', 'desc')
            ->limit(5)
            ->get();

        // Derniers besoins
        $derniersBesoins = Besoin::where('utilisateur_id', $userId)
            ->with('service')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Dernières pannes
        $dernieresPannes = Panne::where('user_declarant_id', $userId)
            ->with(['materiel.marque', 'technicien'])
            ->orderBy('date_declaration', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'compteurs' => [
                'materiel_affecte' => $materielAffecte,
                'besoins_en_attente' => $besoinsEnAttente,
                'besoins_valides' => $besoinsValides,
                'pannes_declarees' => $pannesDeclarees,
                'pannes_en_cours' => $pannesEnCours,
                'pannes_resolues' => $pannesResolues,
            ],
            'dernieres_affectations' => $dernieresAffectations,
            'derniers_besoins' => $derniersBesoins,
            'dernieres_pannes' => $dernieresPannes,
        ]);
    }
}