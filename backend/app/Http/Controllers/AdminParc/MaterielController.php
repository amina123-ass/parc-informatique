<?php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminParc\{StoreMaterielRequest, UpdateMaterielRequest};
use App\Models\{Materiel, MaterielDetail, Affectation};
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;

class MaterielController extends Controller
{
    // ─────────────────────────────────────────────────
    // INDEX — listing avec filtres
    // ─────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Materiel::with([
            'categorie', 'sousCategorie', 'marque',
            'affectationActive.service', 'affectationActive.user',
        ]);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('sous_category_id')) {
            $query->where('sous_category_id', $request->sous_category_id);
        }

        if ($request->filled('etat')) {
            $query->where('etat', $request->etat);
        }

        if ($request->filled('service_id')) {
            $query->whereHas('affectationActive', function ($q) use ($request) {
                $q->where('service_id', $request->service_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('model', 'like', "%{$search}%")
                  ->orWhere('numero_serie', 'like', "%{$search}%")  // ✅ recherche par N° série
                  ->orWhereHas('marque', fn($mq) => $mq->where('nom', 'like', "%{$search}%"))
                  ->orWhereHas('affectationActive.user', function ($uq) use ($search) {
                      $uq->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%");
                  });
            });
        }

        // Pour la page réforme
        if ($request->boolean('reforme_only')) {
            $query->where('etat', 'REFORME');
        }

        // Pour la corbeille
        if ($request->boolean('trashed_only')) {
            $query->onlyTrashed();
        }

        $materiels = $query->orderBy('created_at', 'desc')
                           ->paginate($request->get('per_page', 20));

        return response()->json($materiels);
    }

    // ─────────────────────────────────────────────────
    // SHOW — détail + specs + affectation active
    // ─────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $materiel = Materiel::withTrashed()
            ->with([
                'categorie', 'sousCategorie', 'marque', 'details',
                'affectationActive.service', 'affectationActive.user',
                'affectations.service', 'affectations.user',
            ])
            ->findOrFail($id);

        $data = $materiel->toArray();
        $data['specs'] = $materiel->specs;

        return response()->json($data);
    }

    // ─────────────────────────────────────────────────
    // STORE — création + specs + affectation optionnelle
    // ─────────────────────────────────────────────────
    public function store(StoreMaterielRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = DB::transaction(function () use ($validated, $request) {
            // 1. Créer le matériel
            $materielData = collect($validated)->except(['specs', 'affectation'])->toArray();

            // Si affectation fournie, forcer etat = AFFECTE
            if (!empty($validated['affectation'])) {
                $materielData['etat'] = 'AFFECTE';
            }

            $materiel = Materiel::create($materielData);

            // 2. Insérer specs (key/value)
            if (!empty($validated['specs'])) {
                foreach ($validated['specs'] as $key => $value) {
                    if ($value !== null && $value !== '') {
                        MaterielDetail::create([
                            'materiel_id' => $materiel->id,
                            'key'         => $key,
                            'value'       => $value,
                        ]);
                    }
                }
            }

            // 3. Créer affectation si fournie
            $affectation = null;
            if (!empty($validated['affectation'])) {
                $affData = $validated['affectation'];
                $affData['materiel_id'] = $materiel->id;
                $affData['status']      = 'ACTIVE';

                // Upload PDF bon de sortie
                if ($request->hasFile('bon_sortie_pdf')) {
                    $affData['bon_sortie_pdf'] = $request->file('bon_sortie_pdf')
                        ->store('bons-sortie', 'public');
                }

                $affectation = Affectation::create($affData);
            }

            AuditService::log('CREATE_MATERIEL', 'Materiel', $materiel->id, null, $materiel->toArray());

            return ['materiel' => $materiel, 'affectation' => $affectation];
        });

        $result['materiel']->load([
            'categorie', 'sousCategorie', 'marque', 'details',
            'affectationActive.service', 'affectationActive.user',
        ]);

        return response()->json([
            'message'     => 'Matériel créé avec succès.',
            'materiel'    => $result['materiel'],
            'affectation' => $result['affectation'],
        ], 201);
    }

    // ─────────────────────────────────────────────────
    // UPDATE — modifier matériel + specs
    // ─────────────────────────────────────────────────
    public function update(UpdateMaterielRequest $request, Materiel $materiel): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $materiel) {
            $before = $materiel->toArray();

            // Update matériel
            $materielData = collect($validated)->except(['specs'])->toArray();
            $materiel->update($materielData);

            // Update specs: supprimer anciennes + réinsérer
            if (array_key_exists('specs', $validated)) {
                $materiel->details()->delete();

                if (!empty($validated['specs'])) {
                    foreach ($validated['specs'] as $key => $value) {
                        if ($value !== null && $value !== '') {
                            MaterielDetail::create([
                                'materiel_id' => $materiel->id,
                                'key'         => $key,
                                'value'       => $value,
                            ]);
                        }
                    }
                }
            }

            AuditService::log('UPDATE_MATERIEL', 'Materiel', $materiel->id, $before, $materiel->fresh()->toArray());
        });

        $materiel->load([
            'categorie', 'sousCategorie', 'marque', 'details',
            'affectationActive.service', 'affectationActive.user',
        ]);

        return response()->json([
            'message'  => 'Matériel mis à jour.',
            'materiel' => $materiel,
        ]);
    }

    // ─────────────────────────────────────────────────
    // REFORME — passer en réforme
    // ─────────────────────────────────────────────────
    public function reforme(Materiel $materiel): JsonResponse
    {
        if ($materiel->isReforme()) {
            return response()->json(['message' => 'Ce matériel est déjà réformé.'], 422);
        }

        if ($materiel->hasActiveAffectation()) {
            return response()->json([
                'message' => 'Veuillez retourner le matériel avant de le réformer.',
            ], 422);
        }

        $before = $materiel->toArray();
        $materiel->update([
            'etat'         => 'REFORME',
            'date_reforme' => now()->toDateString(),
        ]);

        AuditService::log('REFORME_MATERIEL', 'Materiel', $materiel->id, $before, $materiel->toArray());

        return response()->json([
            'message'  => 'Matériel réformé avec succès.',
            'materiel' => $materiel->fresh(['categorie', 'sousCategorie', 'marque']),
        ]);
    }

    // ─────────────────────────────────────────────────
    // SOFT DELETE
    // ─────────────────────────────────────────────────
    public function destroy(Materiel $materiel): JsonResponse
    {
        if ($materiel->hasActiveAffectation()) {
            return response()->json([
                'message' => 'Impossible de supprimer: le matériel a une affectation active. Effectuez un retour d\'abord.',
            ], 422);
        }

        AuditService::log('DELETE_MATERIEL', 'Materiel', $materiel->id, $materiel->toArray());
        $materiel->delete();

        return response()->json(['message' => 'Matériel supprimé (corbeille).']);
    }

    // ─────────────────────────────────────────────────
    // RESTORE — restaurer depuis corbeille
    // ─────────────────────────────────────────────────
    public function restore(int $id): JsonResponse
    {
        $materiel = Materiel::onlyTrashed()->findOrFail($id);
        $materiel->restore();

        AuditService::log('RESTORE_MATERIEL', 'Materiel', $materiel->id);

        return response()->json([
            'message'  => 'Matériel restauré.',
            'materiel' => $materiel->fresh(['categorie', 'sousCategorie', 'marque']),
        ]);
    }
}
