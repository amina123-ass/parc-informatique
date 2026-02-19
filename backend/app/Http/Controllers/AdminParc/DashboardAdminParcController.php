<?php
// app/Http/Controllers/AdminParc/DashboardAdminParcController.php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Models\{Materiel, Affectation, Besoin};
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardAdminParcController extends Controller
{
    public function index(): JsonResponse
    {
        // ─────────────────────────────────────────────────
        // STATISTIQUES MATÉRIELS
        // ─────────────────────────────────────────────────
        $totalMateriels = Materiel::count();
        $materielEnStock = Materiel::where('etat', 'EN_STOCK')->count();
        $materielAffecte = Materiel::where('etat', 'AFFECTE')->count();
        $materielReforme = Materiel::where('etat', 'REFORME')->count();
        
        // Matériels par catégorie
        $materielParCategorie = Materiel::select('category_id', DB::raw('count(*) as total'))
            ->with('categorie:id,nom')
            ->groupBy('category_id')
            ->get()
            ->map(fn($item) => [
                'categorie' => $item->categorie?->nom ?? 'N/A',
                'total' => $item->total,
            ]);

        // Matériels récents (30 derniers jours)
        $materielRecents = Materiel::where('created_at', '>=', now()->subDays(30))
            ->count();

        // ─────────────────────────────────────────────────
        // STATISTIQUES AFFECTATIONS
        // ─────────────────────────────────────────────────
        $totalAffectations = Affectation::count();
        $affectationsActives = Affectation::where('status', 'ACTIVE')->count();
        $affectationsRetournees = Affectation::where('status', 'RETURNED')->count();
        
        // Affectations par service
        $affectationsParService = Affectation::select('service_id', DB::raw('count(*) as total'))
            ->where('status', 'ACTIVE')
            ->with('service:id,nom')
            ->groupBy('service_id')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($item) => [
                'service' => $item->service?->nom ?? 'N/A',
                'total' => $item->total,
            ]);

        // Affectations récentes
        $affectationsRecentes = Affectation::with(['materiel.marque', 'service', 'user'])
            ->orderBy('date_affectation', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($aff) => [
                'id' => $aff->id,
                'materiel' => $aff->materiel?->model ?? 'N/A',
                'marque' => $aff->materiel?->marque?->nom ?? 'N/A',
                'service' => $aff->service?->nom ?? 'N/A',
                'user' => $aff->user ? "{$aff->user->nom} {$aff->user->prenom}" : 'N/A',
                'date' => $aff->date_affectation,
                'status' => $aff->status,
            ]);

        // ─────────────────────────────────────────────────
        // STATISTIQUES BESOINS
        // ─────────────────────────────────────────────────
        $totalBesoins = Besoin::count();
        $besoinsEnAttente = Besoin::where('statut', 'en_attente')->count();
        $besoinsEnCours = Besoin::where('statut', 'en_cours')->count();
        $besoinsValides = Besoin::where('statut', 'valide')->count();
        $besoinsRejetes = Besoin::where('statut', 'rejete')->count();
        $tauxSatisfaction = $totalBesoins > 0 
            ? round(($besoinsValides / $totalBesoins) * 100, 1) 
            : 0;

        // Besoins par type
        $besoinsParType = Besoin::select('type_besoin', DB::raw('count(*) as total'))
            ->groupBy('type_besoin')
            ->get()
            ->map(fn($item) => [
                'type' => $item->type_besoin,
                'total' => $item->total,
            ]);

        // Besoins urgents en attente
        $besoinsUrgents = Besoin::where('statut', 'en_attente')
            ->where('priorite', 'urgente')
            ->count();

        // ─────────────────────────────────────────────────
        // ÉVOLUTIONS (6 derniers mois)
        // ─────────────────────────────────────────────────
        
        // Évolution matériels
        $evolutionMateriels = Materiel::select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"),
                DB::raw('count(*) as total')
            )
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // Évolution affectations
        $evolutionAffectations = Affectation::select(
                DB::raw("DATE_FORMAT(date_affectation, '%Y-%m') as mois"),
                DB::raw('count(*) as total')
            )
            ->where('date_affectation', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // Évolution besoins
        $evolutionBesoins = Besoin::select(
                DB::raw("DATE_FORMAT(date_demande, '%Y-%m') as mois"),
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides")
            )
            ->where('date_demande', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // ─────────────────────────────────────────────────
        // ALERTES & NOTIFICATIONS
        // ─────────────────────────────────────────────────
        $alertes = [
            'materiels_en_stock' => $materielEnStock,
            'besoins_urgents' => $besoinsUrgents,
            'besoins_en_attente' => $besoinsEnAttente,
            'materiels_recents' => $materielRecents,
        ];

        // ─────────────────────────────────────────────────
        // RÉPONSE
        // ─────────────────────────────────────────────────
        return response()->json([
            'materiels' => [
                'total' => $totalMateriels,
                'en_stock' => $materielEnStock,
                'affecte' => $materielAffecte,
                'reforme' => $materielReforme,
                'recents' => $materielRecents,
                'par_categorie' => $materielParCategorie,
            ],
            'affectations' => [
                'total' => $totalAffectations,
                'actives' => $affectationsActives,
                'retournees' => $affectationsRetournees,
                'par_service' => $affectationsParService,
                'recentes' => $affectationsRecentes,
            ],
            'besoins' => [
                'total' => $totalBesoins,
                'en_attente' => $besoinsEnAttente,
                'en_cours' => $besoinsEnCours,
                'valides' => $besoinsValides,
                'rejetes' => $besoinsRejetes,
                'urgents' => $besoinsUrgents,
                'taux_satisfaction' => $tauxSatisfaction,
                'par_type' => $besoinsParType,
            ],
            'evolution' => [
                'materiels' => $evolutionMateriels,
                'affectations' => $evolutionAffectations,
                'besoins' => $evolutionBesoins,
            ],
            'alertes' => $alertes,
        ]);
    }
}