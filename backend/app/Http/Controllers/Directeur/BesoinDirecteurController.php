<?php
// app/Http/Controllers/Directeur/BesoinDirecteurController.php

namespace App\Http\Controllers\Directeur;

use App\Http\Controllers\Controller;
use App\Models\Besoin;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;

class BesoinDirecteurController extends Controller
{
    /**
     * Liste des besoins avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Besoin::with(['utilisateur', 'service.entite', 'entite']);

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

        if ($request->filled('type_besoin')) {
            $query->where('type_besoin', $request->type_besoin);
        }

        if ($request->filled('date_from')) {
            $query->where('date_demande', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('date_demande', '<=', $request->date_to);
        }

        $besoins = $query->orderBy('date_demande', 'desc')
                         ->paginate($request->get('per_page', 20));

        return response()->json($besoins);
    }

    /**
     * Statistiques besoins
     */
    public function statistiques(Request $request): JsonResponse
    {
        $entiteId = $request->input('entite_id');

        $stats = [
            'global' => [
                'total' => Besoin::when($entiteId, fn($q) => $q->where('entite_id', $entiteId))->count(),
                'en_attente' => Besoin::where('statut', 'en_attente')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
                'en_cours' => Besoin::where('statut', 'en_cours')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
                'valides' => Besoin::where('statut', 'valide')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
                'rejetes' => Besoin::where('statut', 'rejete')
                    ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                    ->count(),
            ],
            
            'par_type' => Besoin::select('type_besoin', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->groupBy('type_besoin')
                ->get(),
            
            'par_priorite' => Besoin::select('priorite', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->groupBy('priorite')
                ->get(),
            
            'par_service' => Besoin::select('service_id', DB::raw('count(*) as total'))
                ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
                ->with('service:id,nom')
                ->groupBy('service_id')
                ->get(),
            
            'taux_satisfaction' => $this->calculateTauxSatisfaction($entiteId),
        ];

        return response()->json($stats);
    }

    private function calculateTauxSatisfaction($entiteId = null): float
    {
        $total = Besoin::when($entiteId, fn($q) => $q->where('entite_id', $entiteId))->count();
        
        if ($total === 0) return 0;
        
        $valides = Besoin::where('statut', 'valide')
            ->when($entiteId, fn($q) => $q->where('entite_id', $entiteId))
            ->count();
        
        return round(($valides / $total) * 100, 1);
    }
}