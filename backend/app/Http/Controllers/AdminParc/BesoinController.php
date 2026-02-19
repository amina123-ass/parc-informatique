<?php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminParc\StoreBesoinRequest;
use App\Models\{Besoin, BesoinHistorique, Notification};
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Auth, Schema};

class BesoinController extends Controller
{
    /**
     * Relations à charger (entite seulement si la table existe)
     */
    private function getRelations(): array
    {
        $relations = ['utilisateur', 'service'];
        if (Schema::hasTable('entites')) {
            $relations[] = 'entite';
        }
        return $relations;
    }

    // ─────────────────────────────────────────────────
    // INDEX — liste avec filtres avancés
    // ─────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Besoin::with($this->getRelations());

        // Filtre par statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        // Filtre par service
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        // Filtre par entité
        if ($request->filled('entite_id')) {
            $query->where('entite_id', $request->entite_id);
        }

        // Filtre par priorité
        if ($request->filled('priorite')) {
            $query->where('priorite', $request->priorite);
        }

        // Filtre par type
        if ($request->filled('type_besoin')) {
            $query->where('type_besoin', $request->type_besoin);
        }

        // Filtre par date (intervalle)
        if ($request->filled('date_from')) {
            $query->where('date_demande', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date_demande', '<=', $request->date_to);
        }

        // Recherche par nom utilisateur
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('designation', 'like', "%{$search}%")
                  ->orWhere('id', $search)
                  ->orWhereHas('utilisateur', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%")
                          ->orWhere('matricule', 'like', "%{$search}%");
                  });
            });
        }

        $besoins = $query->orderBy('date_demande', 'desc')
                         ->paginate($request->get('per_page', 20));

        return response()->json($besoins);
    }

    // ─────────────────────────────────────────────────
    // SHOW — détail + historique
    // ─────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $relations = array_merge($this->getRelations(), ['historiques.userAction']);

        $besoin = Besoin::with($relations)->findOrFail($id);

        return response()->json($besoin);
    }

    // ─────────────────────────────────────────────────
    // STORE — création d'un nouveau besoin
    // ─────────────────────────────────────────────────
    public function store(StoreBesoinRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['statut'] = 'en_attente';

        $besoin = DB::transaction(function () use ($validated) {
            $besoin = Besoin::create($validated);

            // Historique initial
            BesoinHistorique::create([
                'besoin_id'      => $besoin->id,
                'ancien_statut'  => null,
                'nouveau_statut' => 'en_attente',
                'commentaire'    => 'Demande créée.',
                'user_action_id' => Auth::id(),
                'date_action'    => now(),
            ]);

            AuditService::log('CREATE_BESOIN', 'Besoin', $besoin->id, null, $besoin->toArray());

            return $besoin;
        });

        $besoin->load($this->getRelations());

        return response()->json([
            'message' => 'Besoin créé avec succès.',
            'besoin'  => $besoin,
        ], 201);
    }

    // ─────────────────────────────────────────────────
    // UPDATE — modifier les infos du besoin
    // ─────────────────────────────────────────────────
    public function update(Request $request, Besoin $besoin): JsonResponse
    {
        $validated = $request->validate([
            'type_besoin'  => 'sometimes|in:PC,imprimante,cartouche,autre',
            'designation'  => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'priorite'     => 'sometimes|in:faible,moyenne,urgente',
            'entite_id'    => 'nullable|exists:entites,id',
        ]);

        $before = $besoin->toArray();
        $besoin->update($validated);

        AuditService::log('UPDATE_BESOIN', 'Besoin', $besoin->id, $before, $besoin->toArray());

        return response()->json([
            'message' => 'Besoin mis à jour.',
            'besoin'  => $besoin->fresh($this->getRelations()),
        ]);
    }

    // ─────────────────────────────────────────────────
    // PASSER EN COURS
    // ─────────────────────────────────────────────────
    public function enCours(Request $request, Besoin $besoin): JsonResponse
    {
        if ($besoin->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Seules les demandes en attente peuvent passer en cours.',
            ], 422);
        }

        $request->validate([
            'commentaire' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($besoin, $request) {
            $besoin->changerStatut('en_cours', Auth::id(), $request->commentaire);

            if ($request->commentaire) {
                $besoin->update(['commentaire_responsable' => $request->commentaire]);
            }
        });

        AuditService::log('BESOIN_EN_COURS', 'Besoin', $besoin->id);

        return response()->json([
            'message' => 'Besoin passé en cours de traitement.',
            'besoin'  => $besoin->fresh(array_merge($this->getRelations(), ['historiques.userAction'])),
        ]);
    }

    // ─────────────────────────────────────────────────
    // VALIDER
    // ─────────────────────────────────────────────────
    public function valider(Request $request, Besoin $besoin): JsonResponse
    {
        if (!in_array($besoin->statut, ['en_attente', 'en_cours'])) {
            return response()->json([
                'message' => 'Ce besoin ne peut plus être validé.',
            ], 422);
        }

        $request->validate([
            'commentaire' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($besoin, $request) {
            $besoin->changerStatut('valide', Auth::id(), $request->commentaire);

            $besoin->update([
                'date_reponse'            => now()->toDateString(),
                'commentaire_responsable' => $request->commentaire,
            ]);
        });

        AuditService::log('BESOIN_VALIDE', 'Besoin', $besoin->id);

        return response()->json([
            'message' => 'Besoin validé avec succès.',
            'besoin'  => $besoin->fresh(array_merge($this->getRelations(), ['historiques.userAction'])),
        ]);
    }

    // ─────────────────────────────────────────────────
    // REJETER
    // ─────────────────────────────────────────────────
    public function rejeter(Request $request, Besoin $besoin): JsonResponse
    {
        if (!in_array($besoin->statut, ['en_attente', 'en_cours'])) {
            return response()->json([
                'message' => 'Ce besoin ne peut plus être rejeté.',
            ], 422);
        }

        $request->validate([
            'motif_rejet' => 'required|string|max:1000',
            'commentaire' => 'nullable|string|max:1000',
        ], [
            'motif_rejet.required' => 'Le motif de rejet est obligatoire.',
        ]);

        DB::transaction(function () use ($besoin, $request) {
            $besoin->changerStatut('rejete', Auth::id(), $request->motif_rejet);

            $besoin->update([
                'date_reponse'            => now()->toDateString(),
                'motif_rejet'             => $request->motif_rejet,
                'commentaire_responsable' => $request->commentaire,
            ]);
        });

        AuditService::log('BESOIN_REJETE', 'Besoin', $besoin->id);

        return response()->json([
            'message' => 'Besoin rejeté.',
            'besoin'  => $besoin->fresh(array_merge($this->getRelations(), ['historiques.userAction'])),
        ]);
    }

    // ─────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────
    public function destroy(Besoin $besoin): JsonResponse
    {
        if ($besoin->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Seules les demandes en attente peuvent être supprimées.',
            ], 422);
        }

        AuditService::log('DELETE_BESOIN', 'Besoin', $besoin->id, $besoin->toArray());
        $besoin->delete();

        return response()->json(['message' => 'Besoin supprimé.']);
    }

    // ─────────────────────────────────────────────────
    // DASHBOARD — statistiques
    // ─────────────────────────────────────────────────
    public function dashboard(Request $request): JsonResponse
    {
        // Compteurs globaux
        $total      = Besoin::count();
        $enAttente  = Besoin::where('statut', 'en_attente')->count();
        $enCours    = Besoin::where('statut', 'en_cours')->count();
        $valides    = Besoin::where('statut', 'valide')->count();
        $rejetes    = Besoin::where('statut', 'rejete')->count();
        $tauxSatisfaction = $total > 0 ? round(($valides / $total) * 100, 1) : 0;

        // Répartition par service
        $parService = Besoin::select('service_id', DB::raw('count(*) as total'))
            ->with('service:id,nom')
            ->groupBy('service_id')
            ->get()
            ->map(fn($item) => [
                'service' => $item->service?->nom ?? 'N/A',
                'total'   => $item->total,
            ]);

        // Répartition par type
        $parType = Besoin::select('type_besoin', DB::raw('count(*) as total'))
            ->groupBy('type_besoin')
            ->get()
            ->map(fn($item) => [
                'type'  => $item->type_besoin,
                'total' => $item->total,
            ]);

        // Répartition par priorité
        $parPriorite = Besoin::select('priorite', DB::raw('count(*) as total'))
            ->groupBy('priorite')
            ->get()
            ->map(fn($item) => [
                'priorite' => $item->priorite,
                'total'    => $item->total,
            ]);

        // Évolution mensuelle (6 derniers mois)
        $evolution = Besoin::select(
                DB::raw("DATE_FORMAT(date_demande, '%Y-%m') as mois"),
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides"),
                DB::raw("SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) as rejetes")
            )
            ->where('date_demande', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        // Derniers besoins en attente
        $recentsEnAttente = Besoin::with(['utilisateur', 'service'])
            ->where('statut', 'en_attente')
            ->orderBy('date_demande', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'compteurs' => [
                'total'              => $total,
                'en_attente'         => $enAttente,
                'en_cours'           => $enCours,
                'valides'            => $valides,
                'rejetes'            => $rejetes,
                'taux_satisfaction'  => $tauxSatisfaction,
            ],
            'par_service'      => $parService,
            'par_type'         => $parType,
            'par_priorite'     => $parPriorite,
            'evolution'        => $evolution,
            'recents_attente'  => $recentsEnAttente,
        ]);
    }

    // ─────────────────────────────────────────────────
    // NOTIFICATIONS utilisateur
    // ─────────────────────────────────────────────────
    public function notifications(): JsonResponse
    {
        if (!Schema::hasTable('notifications')) {
            return response()->json([]);
        }

        $notifications = Notification::where('user_id', Auth::id())
            ->where('type', 'BESOIN_STATUT')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    public function markNotificationRead(int $id): JsonResponse
    {
        if (!Schema::hasTable('notifications')) {
            return response()->json(['message' => 'OK']);
        }

        $notification = Notification::where('user_id', Auth::id())->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification lue.']);
    }
}