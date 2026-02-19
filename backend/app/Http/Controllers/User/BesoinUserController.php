<?php
// app/Http/Controllers/User/BesoinUserController.php - VERSION FINALE

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Besoin;
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{Auth, DB, Validator};

class BesoinUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Besoin::where('utilisateur_id', Auth::id())
            ->with(['service.entite']);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('type_besoin')) {
            $query->where('type_besoin', $request->type_besoin);
        }

        if ($request->filled('priorite')) {
            $query->where('priorite', $request->priorite);
        }

        $besoins = $query->orderBy('created_at', 'desc')
                        ->paginate($request->get('per_page', 25));

        return response()->json($besoins);
    }

    public function show(int $id): JsonResponse
    {
        $besoin = Besoin::where('utilisateur_id', Auth::id())
            ->with(['service.entite', 'utilisateur'])
            ->findOrFail($id);

        return response()->json($besoin);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // ✅ VALEURS EXACTES DE VOTRE BASE DE DONNÉES
            'type_besoin' => 'required|in:PC,imprimante,cartouche,autre',
            'designation' => 'required|string|max:255',
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

        $besoin = DB::transaction(function () use ($validated) {
            $user = Auth::user();

            $besoinData = [
                'utilisateur_id' => $user->id,
                'service_id' => $user->service_id,
                'entite_id' => $user->service->entite_id ?? null,
                'type_besoin' => $validated['type_besoin'],
                'designation' => $validated['designation'],
                'priorite' => $validated['priorite'],
                'statut' => 'en_attente',
                'description' => $validated['description'],
                'date_demande' => now()->toDateString(),
            ];

            $besoin = Besoin::create($besoinData);

            AuditService::log('CREATE_BESOIN_USER', 'Besoin', $besoin->id, null, $besoin->toArray());

            return $besoin;
        });

        $besoin->load('service.entite');

        return response()->json([
            'message' => 'Demande envoyée avec succès. Elle sera examinée par votre responsable.',
            'besoin' => $besoin,
        ], 201);
    }

    public function cancel(int $id): JsonResponse
    {
        $besoin = Besoin::where('utilisateur_id', Auth::id())->findOrFail($id);

        if ($besoin->statut !== 'en_attente') {
            return response()->json([
                'message' => 'Seuls les besoins en attente peuvent être annulés.',
            ], 422);
        }

        DB::transaction(function () use ($besoin) {
            $before = $besoin->toArray();
            $besoin->update(['statut' => 'rejete']);
            AuditService::log('CANCEL_BESOIN_USER', 'Besoin', $besoin->id, $before, $besoin->toArray());
        });

        return response()->json([
            'message' => 'Demande annulée.',
            'besoin' => $besoin->fresh('service.entite'),
        ]);
    }

    public function statistiques(): JsonResponse
    {
        $userId = Auth::id();

        $total = Besoin::where('utilisateur_id', $userId)->count();
        $enAttente = Besoin::where('utilisateur_id', $userId)->where('statut', 'en_attente')->count();
        $enCours = Besoin::where('utilisateur_id', $userId)->where('statut', 'en_cours')->count();
        $valides = Besoin::where('utilisateur_id', $userId)->where('statut', 'valide')->count();
        $rejetes = Besoin::where('utilisateur_id', $userId)->where('statut', 'rejete')->count();

        $parType = Besoin::where('utilisateur_id', $userId)
            ->select('type_besoin', DB::raw('count(*) as total'))
            ->groupBy('type_besoin')
            ->get();

        $parPriorite = Besoin::where('utilisateur_id', $userId)
            ->select('priorite', DB::raw('count(*) as total'))
            ->groupBy('priorite')
            ->get();

        return response()->json([
            'total' => $total,
            'en_attente' => $enAttente,
            'en_cours' => $enCours,
            'valides' => $valides,
            'rejetes' => $rejetes,
            'par_type' => $parType,
            'par_priorite' => $parPriorite,
        ]);
    }
}