<?php
// app/Http/Controllers/User/PanneUserController.php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\{Panne, Materiel, Affectation};
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{Auth, DB, Validator};

class PanneUserController extends Controller
{
    /**
     * Liste des pannes déclarées par l'utilisateur
     */
    public function index(Request $request): JsonResponse
    {
        $query = Panne::where('user_declarant_id', Auth::id())
            ->with([
                'materiel.marque',
                'materiel.sousCategorie',
                'technicien',
                'service.entite',
            ]);

        // Filtres
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('priorite')) {
            $query->where('priorite', $request->priorite);
        }

        if ($request->filled('type_panne')) {
            $query->where('type_panne', $request->type_panne);
        }

        $pannes = $query->orderBy('date_declaration', 'desc')
                       ->paginate($request->get('per_page', 25));

        return response()->json($pannes);
    }

    /**
     * Détail d'une panne
     */
    public function show(int $id): JsonResponse
    {
        $panne = Panne::where('user_declarant_id', Auth::id())
            ->with([
                'materiel.marque',
                'materiel.sousCategorie',
                'materiel.details',
                'technicien',
                'service.entite',
            ])
            ->findOrFail($id);

        return response()->json($panne);
    }

    /**
     * Déclarer une nouvelle panne
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'materiel_id' => 'required|exists:materiels,id',
            'type_panne' => 'required|in:materielle,logicielle,reseau,autre',
            'priorite' => 'required|in:faible,moyenne,urgente',
            'description' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $userId = Auth::id();

        // Vérifier que le matériel est bien affecté à l'utilisateur (affectation active)
        $affectation = Affectation::where('materiel_id', $validated['materiel_id'])
            ->where('user_id', $userId)
            ->whereNull('date_retour')
            ->first();

        if (!$affectation) {
            return response()->json([
                'message' => 'Vous ne pouvez déclarer une panne que sur le matériel qui vous est affecté.',
            ], 403);
        }

        $panne = DB::transaction(function () use ($validated, $userId, $affectation) {
            $panneData = [
                'materiel_id' => $validated['materiel_id'],
                'user_declarant_id' => $userId,
                'service_id' => $affectation->service_id,
                'entite_id' => $affectation->service->entite_id ?? null,
                'type_panne' => $validated['type_panne'],
                'priorite' => $validated['priorite'],
                'statut' => 'declaree',
                'description' => $validated['description'],
                'date_declaration' => now()->toDateString(),
            ];

            $panne = Panne::create($panneData);

            AuditService::log('CREATE_PANNE_USER', 'Panne', $panne->id, null, $panne->toArray());

            return $panne;
        });

        $panne->load(['materiel.marque', 'service.entite']);

        return response()->json([
            'message' => 'Panne déclarée avec succès. Un technicien sera notifié.',
            'panne' => $panne,
        ], 201);
    }

    /**
     * Annuler une panne (seulement si déclarée)
     */
    public function cancel(int $id): JsonResponse
    {
        $panne = Panne::where('user_declarant_id', Auth::id())->findOrFail($id);

        if ($panne->statut !== 'declaree') {
            return response()->json([
                'message' => 'Seules les pannes non prises en charge peuvent être annulées.',
            ], 422);
        }

        DB::transaction(function () use ($panne) {
            $before = $panne->toArray();

            $panne->update([
                'statut' => 'annulee',
                'commentaire_technicien' => 'Annulée par le déclarant',
            ]);

            AuditService::log('CANCEL_PANNE_USER', 'Panne', $panne->id, $before, $panne->toArray());
        });

        return response()->json([
            'message' => 'Panne annulée.',
            'panne' => $panne->fresh(['materiel.marque', 'service.entite']),
        ]);
    }

    /**
     * Liste des matériels affectés pour déclarer une panne
     */
    public function mesMateriels(): JsonResponse
    {
        $materiels = Affectation::where('user_id', Auth::id())
            ->whereNull('date_retour')
            ->with(['materiel.marque', 'materiel.sousCategorie', 'service'])
            ->get()
            ->pluck('materiel')
            ->map(function ($materiel) {
                return [
                    'id' => $materiel->id,
                    'label' => "{$materiel->marque->nom} {$materiel->model}",
                    'marque' => $materiel->marque->nom,
                    'model' => $materiel->model,
                    'numero_inventaire' => $materiel->numero_inventaire,
                    'sous_categorie' => $materiel->sousCategorie->nom ?? null,
                ];
            });

        return response()->json($materiels);
    }

    /**
     * Statistiques des pannes de l'utilisateur
     */
    public function statistiques(): JsonResponse
    {
        $userId = Auth::id();

        $total = Panne::where('user_declarant_id', $userId)->count();
        $declarees = Panne::where('user_declarant_id', $userId)->where('statut', 'declaree')->count();
        $enCours = Panne::where('user_declarant_id', $userId)->where('statut', 'en_cours')->count();
        $resolues = Panne::where('user_declarant_id', $userId)->where('statut', 'resolue')->count();

        $parType = Panne::where('user_declarant_id', $userId)
            ->select('type_panne', DB::raw('count(*) as total'))
            ->groupBy('type_panne')
            ->get();

        $delaiMoyen = Panne::where('user_declarant_id', $userId)
            ->where('statut', 'resolue')
            ->whereNotNull('date_resolution')
            ->get()
            ->avg(function ($p) {
                return $p->date_declaration->diffInDays($p->date_resolution);
            });

        return response()->json([
            'total' => $total,
            'declarees' => $declarees,
            'en_cours' => $enCours,
            'resolues' => $resolues,
            'par_type' => $parType,
            'delai_moyen' => round($delaiMoyen ?? 0, 1),
        ]);
    }
}