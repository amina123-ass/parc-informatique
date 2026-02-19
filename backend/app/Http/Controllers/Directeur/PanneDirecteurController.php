<?php
// app/Http/Controllers/Directeur/PanneDirecteurController.php

namespace App\Http\Controllers\Directeur;

use App\Http\Controllers\Controller;
use App\Models\Panne;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;

class PanneDirecteurController extends Controller
{
    /**
     * Liste des pannes avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Panne::with([
            'materiel.categorie',
            'materiel.sousCategorie',
            'materiel.marque',
            'declarant',
            'technicien',
            'service.entite',
            'entite',
        ]);

        // Filtres
        if ($request->filled('entite_id')) {
            $query->where('entite_id', $request->entite_id);
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('priorite')) {
            $query->where('priorite', $request->priorite);
        }

        if ($request->filled('type_panne')) {
            $query->where('type_panne', $request->type_panne);
        }

        if ($request->filled('date_from')) {
            $query->where('date_declaration', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('date_declaration', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_ticket', 'like', "%{$search}%")
                  ->orWhereHas('materiel', fn($mq) => $mq->where('model', 'like', "%{$search}%"))
                  ->orWhereHas('declarant', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%");
                  });
            });
        }

        $pannes = $query->orderBy('date_declaration', 'desc')
                        ->paginate($request->get('per_page', 20));

        return response()->json($pannes);
    }

    /**
     * Détail d'une panne
     */
    public function show(int $id): JsonResponse
    {
        $panne = Panne::with([
            'materiel.categorie',
            'materiel.sousCategorie',
            'materiel.marque',
            'declarant',
            'technicien',
            'service.entite',
            'entite',
        ])->findOrFail($id);

        return response()->json($panne);
    }

    /**
     * Statistiques pannes
     */
    public function statistiques(Request $request): JsonResponse
    {
        $entiteId = $request->input('entite_id');

        $stats = [
            'global' => [
                'total' => Panne::when($entiteId, fn($q) => $q->where('entite_id', $entiteId))->count(),
                'declarees' => Panne::where('statut', 'declaree')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
                'en_cours' => Panne::where('statut', 'en_cours')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
                'resolues' => Panne::where('statut', 'resolue')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
            ],
            
            'par_type' => Panne::select('type_panne', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->groupBy('type_panne')
                ->get(),
            
            'par_priorite' => Panne::select('priorite', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->groupBy('priorite')
                ->get(),
            
            'par_service' => Panne::select('service_id', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->with('service:id,nom')
                ->groupBy('service_id')
                ->get(),
            
            'delai_moyen_resolution' => $this->calculateDelaiMoyenResolution($entiteId),
            'taux_resolution' => $this->calculateTauxResolution($entiteId),
        ];

        return response()->json($stats);
    }

    private function calculateDelaiMoyenResolution($entiteId = null): float
    {
        $pannes = Panne::where('statut', 'resolue')
            ->whereNotNull('date_resolution')
            ->whereNotNull('date_declaration')
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->get();

        if ($pannes->isEmpty()) return 0;

        $totalDelai = $pannes->sum(fn($p) => $p->date_declaration->diffInDays($p->date_resolution));
        
        return round($totalDelai / $pannes->count(), 1);
    }

    private function calculateTauxResolution($entiteId = null): float
    {
        $total = Panne::when($entiteId, fn($q) => $q->where('entite_id', $entiteId))->count();
        
        if ($total === 0) return 0;
        
        $resolues = Panne::where('statut', 'resolue')
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->count();
        
        return round(($resolues / $total) * 100, 1);
    }

    /**
     * Dashboard pannes
     */
    public function dashboard(Request $request): JsonResponse
    {
        $entiteId = $request->input('entite_id');

        // Évolution mensuelle (6 derniers mois)
        $evolution = Panne::select(
                DB::raw("DATE_FORMAT(date_declaration, '%Y-%m') as mois"),
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN statut = 'resolue' THEN 1 ELSE 0 END) as resolues"),
                DB::raw("SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours")
            )
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->where('date_declaration', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // Pannes urgentes en attente
        $urgentes = Panne::where('statut', 'declaree')
            ->where('priorite', 'urgente')
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->with(['materiel', 'service', 'declarant'])
            ->orderBy('date_declaration', 'asc')
            ->limit(10)
            ->get();

        // Top matériels avec pannes récurrentes
        $topMateriels = Panne::select('materiel_id', DB::raw('count(*) as nb_pannes'))
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->with('materiel.marque')
            ->groupBy('materiel_id')
            ->orderBy('nb_pannes', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'evolution' => $evolution,
            'urgentes' => $urgentes,
            'top_materiels' => $topMateriels,
            'statistiques' => $this->statistiques($request)->getData(),
        ]);
    }
}