<?php
// app/Http/Controllers/Directeur/MaterielDirecteurController.php

namespace App\Http\Controllers\Directeur;

use App\Http\Controllers\Controller;
use App\Models\{Materiel, Affectation};
use Illuminate\Http\{JsonResponse, Request};

class MaterielDirecteurController extends Controller
{
    /**
     * Matériels affectés avec filtres entité/service/utilisateur
     */
    public function affectations(Request $request): JsonResponse
    {
        $query = Affectation::with([
            'materiel.categorie',
            'materiel.sousCategorie',
            'materiel.marque',
            'service.entite',
            'user.entite',
        ])->where('status', 'ACTIVE');

        // Filtre par entité
        if ($request->filled('entite_id')) {
            $entiteId = $request->entite_id;
            $query->where(function ($q) use ($entiteId) {
                $q->whereHas('service', fn($sq) => $sq->where('entite_id', $entiteId))
                  ->orWhereHas('user', fn($uq) => $uq->where('entite_id', $entiteId));
            });
        }

        // Filtre par service
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        // Filtre par utilisateur
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtre par catégorie
        if ($request->filled('category_id')) {
            $query->whereHas('materiel', fn($mq) => $mq->where('category_id', $request->category_id));
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('materiel', fn($mq) => $mq->where('model', 'like', "%{$search}%"))
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%");
                  })
                  ->orWhereHas('service', fn($sq) => $sq->where('nom', 'like', "%{$search}%"));
            });
        }

        $affectations = $query->orderBy('date_affectation', 'desc')
                              ->paginate($request->get('per_page', 20));

        return response()->json($affectations);
    }

    /**
     * Statistiques matériels par entité
     */
    public function statistiquesParEntite(Request $request): JsonResponse
    {
        $entiteId = $request->input('entite_id');

        $stats = [
            'total_affecte' => Affectation::where('status', 'ACTIVE')
                ->when($entiteId, function ($q) use ($entiteId) {
                    $q->whereHas('service', fn($sq) => $sq->where('entite_id', $entiteId));
                })
                ->count(),
            
            'par_categorie' => Affectation::select('materiels.category_id', DB::raw('count(*) as total'))
                ->join('materiels', 'affectations.materiel_id', '=', 'materiels.id')
                ->where('affectations.status', 'ACTIVE')
                ->when($entiteId, function ($q) use ($entiteId) {
                    $q->whereHas('service', fn($sq) => $sq->where('entite_id', $entiteId));
                })
                ->with('materiel.categorie:id,nom')
                ->groupBy('materiels.category_id')
                ->get(),
            
            'par_service' => Affectation::select('service_id', DB::raw('count(*) as total'))
                ->where('status', 'ACTIVE')
                ->when($entiteId, function ($q) use ($entiteId) {
                    $q->whereHas('service', fn($sq) => $sq->where('entite_id', $entiteId));
                })
                ->with('service:id,nom')
                ->groupBy('service_id')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Export Excel des matériels affectés
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        // Utiliser Laravel Excel ou PhpSpreadsheet
        // Exemple simplifié
        return response()->download(/* path to generated file */);
    }
}