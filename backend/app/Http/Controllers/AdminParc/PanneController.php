<?php
// app/Http/Controllers/AdminParc/PanneController.php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Models\{Panne, Materiel, User};
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Auth, Validator};

class PanneController extends Controller
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
                        ->paginate($request->get('per_page', 25));

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
            'materiel.details',
            'materiel.affectationActive.service',
            'materiel.affectationActive.user',
            'declarant',
            'technicien',
            'service.entite',
            'entite',
        ])->findOrFail($id);

        return response()->json($panne);
    }

    /**
     * Créer une nouvelle panne
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'materiel_id' => 'required|exists:materiels,id',
            'type_panne' => 'required|in:materielle,logicielle,reseau,autre',
            'priorite' => 'required|in:faible,moyenne,urgente',
            'description' => 'required|string|max:2000',
            'user_declarant_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Récupérer le matériel pour obtenir service et entité
        $materiel = Materiel::with('affectationActive.service')->findOrFail($validated['materiel_id']);

        $panne = DB::transaction(function () use ($validated, $materiel) {
            $panneData = [
                'materiel_id' => $validated['materiel_id'],
                'user_declarant_id' => $validated['user_declarant_id'] ?? Auth::id(),
                'service_id' => $materiel->affectationActive->service_id ?? null,
                'entite_id' => $materiel->affectationActive->service->entite_id ?? null,
                'type_panne' => $validated['type_panne'],
                'priorite' => $validated['priorite'],
                'statut' => 'declaree',
                'description' => $validated['description'],
                'date_declaration' => now()->toDateString(),
            ];

            $panne = Panne::create($panneData);

            AuditService::log('CREATE_PANNE', 'Panne', $panne->id, null, $panne->toArray());

            return $panne;
        });

        $panne->load([
            'materiel.marque',
            'declarant',
            'service.entite',
        ]);

        return response()->json([
            'message' => 'Panne déclarée avec succès.',
            'panne' => $panne,
        ], 201);
    }

    /**
     * Passer une panne en cours
     */
    public function priseEnCharge(Request $request, int $id): JsonResponse
    {
        $panne = Panne::findOrFail($id);

        if ($panne->statut !== 'declaree') {
            return response()->json([
                'message' => 'Seules les pannes déclarées peuvent être prises en charge.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'technicien_id' => 'required|exists:users,id',
            'diagnostic' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        DB::transaction(function () use ($panne, $validated) {
            $before = $panne->toArray();

            $panne->update([
                'statut' => 'en_cours',
                'technicien_id' => $validated['technicien_id'],
                'diagnostic' => $validated['diagnostic'] ?? null,
                'date_prise_en_charge' => now()->toDateString(),
            ]);

            AuditService::log('PANNE_EN_COURS', 'Panne', $panne->id, $before, $panne->toArray());
        });

        return response()->json([
            'message' => 'Panne prise en charge.',
            'panne' => $panne->fresh([
                'materiel.marque',
                'declarant',
                'technicien',
                'service.entite',
            ]),
        ]);
    }

    /**
     * Résoudre une panne
     */
    public function resoudre(Request $request, int $id): JsonResponse
    {
        $panne = Panne::findOrFail($id);

        if (!in_array($panne->statut, ['declaree', 'en_cours'])) {
            return response()->json([
                'message' => 'Cette panne ne peut plus être résolue.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'solution' => 'required|string|max:2000',
            'commentaire_technicien' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        DB::transaction(function () use ($panne, $validated) {
            $before = $panne->toArray();

            $panne->update([
                'statut' => 'resolue',
                'solution' => $validated['solution'],
                'commentaire_technicien' => $validated['commentaire_technicien'] ?? null,
                'date_resolution' => now()->toDateString(),
                'technicien_id' => $panne->technicien_id ?? Auth::id(),
            ]);

            AuditService::log('PANNE_RESOLUE', 'Panne', $panne->id, $before, $panne->toArray());
        });

        return response()->json([
            'message' => 'Panne résolue avec succès.',
            'panne' => $panne->fresh([
                'materiel.marque',
                'declarant',
                'technicien',
                'service.entite',
            ]),
        ]);
    }

    /**
     * Annuler une panne
     */
    public function annuler(Request $request, int $id): JsonResponse
    {
        $panne = Panne::findOrFail($id);

        if ($panne->statut === 'resolue') {
            return response()->json([
                'message' => 'Impossible d\'annuler une panne déjà résolue.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'motif_annulation' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::transaction(function () use ($panne, $request) {
            $before = $panne->toArray();

            $panne->update([
                'statut' => 'annulee',
                'commentaire_technicien' => $request->motif_annulation,
            ]);

            AuditService::log('PANNE_ANNULEE', 'Panne', $panne->id, $before, $panne->toArray());
        });

        return response()->json([
            'message' => 'Panne annulée.',
            'panne' => $panne->fresh([
                'materiel.marque',
                'declarant',
                'technicien',
                'service.entite',
            ]),
        ]);
    }

    /**
     * Mettre à jour une panne
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $panne = Panne::findOrFail($id);

        if ($panne->statut === 'resolue') {
            return response()->json([
                'message' => 'Impossible de modifier une panne résolue.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'priorite' => 'sometimes|in:faible,moyenne,urgente',
            'type_panne' => 'sometimes|in:materielle,logicielle,reseau,autre',
            'description' => 'sometimes|string|max:2000',
            'diagnostic' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $before = $panne->toArray();
        $panne->update($request->only(['priorite', 'type_panne', 'description', 'diagnostic']));

        AuditService::log('UPDATE_PANNE', 'Panne', $panne->id, $before, $panne->toArray());

        return response()->json([
            'message' => 'Panne mise à jour.',
            'panne' => $panne->fresh([
                'materiel.marque',
                'declarant',
                'technicien',
                'service.entite',
            ]),
        ]);
    }

    /**
     * Supprimer une panne
     */
    public function destroy(int $id): JsonResponse
    {
        $panne = Panne::findOrFail($id);

        if ($panne->statut !== 'declaree') {
            return response()->json([
                'message' => 'Seules les pannes déclarées peuvent être supprimées.',
            ], 422);
        }

        AuditService::log('DELETE_PANNE', 'Panne', $panne->id, $panne->toArray());
        $panne->delete();

        return response()->json(['message' => 'Panne supprimée.']);
    }

    /**
     * Dashboard des pannes
     */
    public function dashboard(): JsonResponse
    {
        // Compteurs
        $total = Panne::count();
        $declarees = Panne::where('statut', 'declaree')->count();
        $enCours = Panne::where('statut', 'en_cours')->count();
        $resolues = Panne::where('statut', 'resolue')->count();
        $annulees = Panne::where('statut', 'annulee')->count();

        $tauxResolution = $total > 0 ? round(($resolues / $total) * 100, 1) : 0;

        // Délai moyen de résolution
        $pannesResolues = Panne::where('statut', 'resolue')
            ->whereNotNull('date_resolution')
            ->whereNotNull('date_declaration')
            ->get();

        $delaiMoyen = 0;
        if ($pannesResolues->isNotEmpty()) {
            $delaiMoyen = $pannesResolues->avg(function($p) {
                return \Carbon\Carbon::parse($p->date_declaration)
                    ->diffInDays(\Carbon\Carbon::parse($p->date_resolution));
            });
        }

        // Par type
        $parType = Panne::select('type_panne', DB::raw('count(*) as total'))
            ->groupBy('type_panne')
            ->get();

        // Par priorité
        $parPriorite = Panne::select('priorite', DB::raw('count(*) as total'))
            ->groupBy('priorite')
            ->get();

        // Évolution (6 derniers mois)
        $evolution = Panne::select(
                DB::raw("DATE_FORMAT(date_declaration, '%Y-%m') as mois"),
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN statut = 'resolue' THEN 1 ELSE 0 END) as resolues"),
                DB::raw("SUM(CASE WHEN statut = 'en_cours' THEN 1 ELSE 0 END) as en_cours")
            )
            ->where('date_declaration', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // Pannes urgentes
        $urgentes = Panne::where('statut', 'declaree')
            ->where('priorite', 'urgente')
            ->with(['materiel.marque', 'service', 'declarant'])
            ->orderBy('date_declaration', 'asc')
            ->limit(10)
            ->get();

        // Top matériels avec pannes
        $topMateriels = Panne::select('materiel_id', DB::raw('count(*) as nb_pannes'))
            ->with('materiel.marque')
            ->groupBy('materiel_id')
            ->orderBy('nb_pannes', 'desc')
            ->limit(10)
            ->get();

        // Dernières pannes résolues
        $dernieresResolues = Panne::where('statut', 'resolue')
            ->with(['materiel.marque', 'technicien'])
            ->orderBy('date_resolution', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'compteurs' => [
                'total' => $total,
                'declarees' => $declarees,
                'en_cours' => $enCours,
                'resolues' => $resolues,
                'annulees' => $annulees,
                'taux_resolution' => $tauxResolution,
                'delai_moyen' => round($delaiMoyen, 1),
            ],
            'par_type' => $parType,
            'par_priorite' => $parPriorite,
            'evolution' => $evolution,
            'urgentes' => $urgentes,
            'top_materiels' => $topMateriels,
            'dernieres_resolues' => $dernieresResolues,
        ]);
    }

    /**
     * Liste des techniciens disponibles
     */
    public function techniciens(): JsonResponse
    {
        // Récupérer les utilisateurs avec le rôle technicien ou admin parc
        $techniciens = User::where('account_active', true)
            ->whereHas('role', function($q) {
                $q->whereIn('nom', ['ADMIN_PARC', 'TECHNICIEN']);
            })
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom', 'fonction']);

        return response()->json($techniciens);
    }
}