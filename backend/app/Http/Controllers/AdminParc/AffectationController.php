<?php
// app/Http/Controllers/AdminParc/AffectationController.php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminParc\StoreAffectationRequest;
use App\Models\{Affectation, Materiel};
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Storage};

class AffectationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Affectation::with([
            'materiel.marque',
            'materiel.sousCategorie',
            'service.entite',  // ← Eager load entite
            'user.entite',     // ← Eager load entite
        ]);

        // Filtre par matériel
        if ($request->filled('materiel_id')) {
            $query->where('materiel_id', $request->materiel_id);
        }

        // Filtre par service
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        // Filtre par utilisateur
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtre par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtre par entité/structure
        if ($request->filled('entite_id')) {
            $entiteId = $request->entite_id;
            $query->where(function ($q) use ($entiteId) {
                $q->whereHas('service', function ($sq) use ($entiteId) {
                    $sq->where('entite_id', $entiteId);
                })
                ->orWhereHas('user', function ($uq) use ($entiteId) {
                    $uq->where('entite_id', $entiteId);
                });
            });
        }

        // Recherche textuelle
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_inventaire', 'like', "%{$search}%")
                  ->orWhere('bon_sortie', 'like', "%{$search}%")
                  ->orWhereHas('materiel', fn($mq) => $mq->where('model', 'like', "%{$search}%"))
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%")
                          ->orWhere('matricule', 'like', "%{$search}%");
                  })
                  ->orWhereHas('service', function ($sq) use ($search) {
                      $sq->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        $affectations = $query->orderBy('date_affectation', 'desc')
                              ->paginate($request->get('per_page', 20));

        return response()->json($affectations);
    }

    public function store(StoreAffectationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $materiel = Materiel::findOrFail($validated['materiel_id']);

        if ($materiel->isReforme()) {
            return response()->json(['message' => 'Impossible: matériel réformé.'], 422);
        }

        if ($materiel->hasActiveAffectation()) {
            return response()->json(['message' => 'Ce matériel a déjà une affectation active. Effectuez un retour d\'abord.'], 422);
        }

        $affectation = DB::transaction(function () use ($validated, $materiel, $request) {
            $validated['status'] = 'ACTIVE';

            // Upload PDF bon de sortie
            if ($request->hasFile('bon_sortie_pdf')) {
                $validated['bon_sortie_pdf'] = $request->file('bon_sortie_pdf')
                    ->store('bons-sortie', 'public');
            }

            $affectation = Affectation::create($validated);

            $materiel->update(['etat' => 'AFFECTE']);

            AuditService::log('CREATE_AFFECTATION', 'Affectation', $affectation->id, null, $affectation->toArray());

            return $affectation;
        });

        $affectation->load(['materiel', 'service', 'user']);

        return response()->json([
            'message'     => 'Affectation créée avec succès.',
            'affectation' => $affectation,
        ], 201);
    }

    public function returnMateriel(Affectation $affectation): JsonResponse
    {
        if (!$affectation->isActive()) {
            return response()->json(['message' => 'Cette affectation est déjà retournée.'], 422);
        }

        DB::transaction(function () use ($affectation) {
            $before = $affectation->toArray();

            $affectation->update([
                'status'      => 'RETURNED',
                'date_retour' => now()->toDateString(),
            ]);

            $affectation->materiel->update(['etat' => 'EN_STOCK']);

            AuditService::log('RETURN_MATERIEL', 'Affectation', $affectation->id, $before, $affectation->toArray());
        });

        return response()->json([
            'message'     => 'Matériel retourné avec succès.',
            'affectation' => $affectation->fresh(['materiel', 'service', 'user']),
        ]);
    }
}