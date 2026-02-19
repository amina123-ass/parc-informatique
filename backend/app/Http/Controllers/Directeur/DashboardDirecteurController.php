<?php
// app/Http/Controllers/Directeur/DashboardDirecteurController.php

namespace App\Http\Controllers\Directeur;

use App\Http\Controllers\Controller;
use App\Models\{Materiel, Affectation, Besoin, Panne};
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\{DB, Schema};
use Exception;

class DashboardDirecteurController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            // Vérifier si la table pannes existe
            $pannesExists = Schema::hasTable('pannes');

            // ─────────────────────────────────────────────────
            // VUE D'ENSEMBLE
            // ─────────────────────────────────────────────────
            $vueEnsemble = [
                'total_materiels' => Materiel::count(),
                'materiels_affectes' => Materiel::where('etat', 'AFFECTE')->count(),
                'materiels_stock' => Materiel::where('etat', 'EN_STOCK')->count(),
                'materiels_reforme' => Materiel::where('etat', 'REFORME')->count(),
                
                'total_affectations_actives' => Affectation::where('status', 'ACTIVE')->count(),
                
                'total_besoins' => Besoin::count(),
                'besoins_en_attente' => Besoin::where('statut', 'en_attente')->count(),
                'besoins_en_cours' => Besoin::where('statut', 'en_cours')->count(),
                'besoins_valides' => Besoin::where('statut', 'valide')->count(),
                
                'total_pannes' => $pannesExists ? Panne::count() : 0,
                'pannes_declarees' => $pannesExists ? Panne::where('statut', 'declaree')->count() : 0,
                'pannes_en_cours' => $pannesExists ? Panne::where('statut', 'en_cours')->count() : 0,
                'pannes_resolues' => $pannesExists ? Panne::where('statut', 'resolue')->count() : 0,
            ];

            // ─────────────────────────────────────────────────
            // RÉPARTITION PAR ENTITÉ
            // ─────────────────────────────────────────────────
            $entiteExists = Schema::hasTable('entites');

            if ($entiteExists) {
                $materielParEntite = DB::table('affectations')
                    ->join('services', 'affectations.service_id', '=', 'services.id')
                    ->join('entites', 'services.entite_id', '=', 'entites.id')
                    ->where('affectations.status', 'ACTIVE')
                    ->select('entites.nom as entite', DB::raw('count(*) as total'))
                    ->groupBy('entites.id', 'entites.nom')
                    ->get();

                $besoinsParEntite = DB::table('besoins')
                    ->join('entites', 'besoins.entite_id', '=', 'entites.id')
                    ->select('entites.nom as entite', DB::raw('count(*) as total'))
                    ->groupBy('entites.id', 'entites.nom')
                    ->get();

                $pannesParEntite = $pannesExists 
                    ? DB::table('pannes')
                        ->join('entites', 'pannes.entite_id', '=', 'entites.id')
                        ->select('entites.nom as entite', DB::raw('count(*) as total'))
                        ->groupBy('entites.id', 'entites.nom')
                        ->get()
                    : collect([]);
            } else {
                $materielParEntite = collect([]);
                $besoinsParEntite = collect([]);
                $pannesParEntite = collect([]);
            }

            // ─────────────────────────────────────────────────
            // ÉVOLUTION SUR 6 MOIS
            // ─────────────────────────────────────────────────
            $evolutionMateriels = Materiel::select(
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mois"),
                    DB::raw('count(*) as total')
                )
                ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();

            $evolutionBesoins = Besoin::select(
                    DB::raw("DATE_FORMAT(date_demande, '%Y-%m') as mois"),
                    DB::raw('count(*) as total'),
                    DB::raw("SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides"),
                    DB::raw("SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) as rejetes")
                )
                ->where('date_demande', '>=', now()->subMonths(6)->startOfMonth())
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();

            $evolutionPannes = $pannesExists 
                ? Panne::select(
                        DB::raw("DATE_FORMAT(date_declaration, '%Y-%m') as mois"),
                        DB::raw('count(*) as total'),
                        DB::raw("SUM(CASE WHEN statut = 'resolue' THEN 1 ELSE 0 END) as resolues")
                    )
                    ->where('date_declaration', '>=', now()->subMonths(6)->startOfMonth())
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get()
                : collect([]);

            // ─────────────────────────────────────────────────
            // INDICATEURS DE PERFORMANCE
            // ─────────────────────────────────────────────────
            $tauxSatisfactionBesoins = Besoin::count() > 0
                ? round((Besoin::where('statut', 'valide')->count() / Besoin::count()) * 100, 1)
                : 0;

            $tauxResolutionPannes = 0;
            $delaiMoyenResolution = 0;

            if ($pannesExists && Panne::count() > 0) {
                $tauxResolutionPannes = round((Panne::where('statut', 'resolue')->count() / Panne::count()) * 100, 1);
                
                $pannesResolues = Panne::where('statut', 'resolue')
                    ->whereNotNull('date_resolution')
                    ->whereNotNull('date_declaration')
                    ->get();

                if ($pannesResolues->isNotEmpty()) {
                    $delaiMoyenResolution = $pannesResolues->avg(function($p) {
                        return \Carbon\Carbon::parse($p->date_declaration)
                            ->diffInDays(\Carbon\Carbon::parse($p->date_resolution));
                    });
                }
            }

            // ─────────────────────────────────────────────────
            // ALERTES
            // ─────────────────────────────────────────────────
            $alertes = [
                'besoins_urgents_attente' => Besoin::where('statut', 'en_attente')
                    ->where('priorite', 'urgente')
                    ->count(),
                'pannes_urgentes_declarees' => $pannesExists 
                    ? Panne::where('statut', 'declaree')->where('priorite', 'urgente')->count()
                    : 0,
                'materiels_stock_bas' => Materiel::where('etat', 'EN_STOCK')->count() < 10,
            ];

            // ─────────────────────────────────────────────────
            // RÉPONSE
            // ─────────────────────────────────────────────────
            return response()->json([
                'vue_ensemble' => $vueEnsemble,
                'repartition' => [
                    'materiels_par_entite' => $materielParEntite,
                    'besoins_par_entite' => $besoinsParEntite,
                    'pannes_par_entite' => $pannesParEntite,
                ],
                'evolution' => [
                    'materiels' => $evolutionMateriels,
                    'besoins' => $evolutionBesoins,
                    'pannes' => $evolutionPannes,
                ],
                'indicateurs' => [
                    'taux_satisfaction_besoins' => $tauxSatisfactionBesoins,
                    'taux_resolution_pannes' => $tauxResolutionPannes,
                    'delai_moyen_resolution' => round($delaiMoyenResolution, 1),
                ],
                'alertes' => $alertes,
            ]);

        } catch (Exception $e) {
            \Log::error('Erreur Dashboard Directeur: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'message' => 'Erreur lors du chargement du dashboard',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}