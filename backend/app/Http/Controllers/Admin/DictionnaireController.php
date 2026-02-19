<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\{AuditService, DictionnaireService};
use Illuminate\Http\{JsonResponse, Request};

class DictionnaireController extends Controller
{
    public function index(string $type): JsonResponse
    {
        $model = DictionnaireService::resolve($type);

        if (!$model) {
            return response()->json(['message' => "Type '{$type}' invalide."], 404);
        }

        $query = $model->newQuery();

        // Relations spéciales
        if ($type === 'sous-categories') {
            $query->with('categorie');
        }

        $items = $query->orderBy($model->getTable() . '.id', 'desc')->get();

        return response()->json($items);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $model = DictionnaireService::resolve($type);

        if (!$model) {
            return response()->json(['message' => "Type '{$type}' invalide."], 404);
        }

        $rules = DictionnaireService::getRules($type);
        $validated = $request->validate($rules);

        $item = $model->newQuery()->create($validated);

        AuditService::log("CREATE_DICO_{$type}", $model->getTable(), $item->id, null, $item->toArray());

        return response()->json($item, 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $modelClass = DictionnaireService::getModelClass($type);

        if (!$modelClass) {
            return response()->json(['message' => "Type '{$type}' invalide."], 404);
        }

        $item = $modelClass::findOrFail($id);
        $before = $item->toArray();

        $rules = DictionnaireService::getRules($type);

        // Adapter les règles unique pour l'update
        foreach ($rules as $field => &$rule) {
            if (is_string($rule) && str_contains($rule, 'unique:')) {
                // Pas de modification automatique ici, on laisse passer
            }
        }

        $validated = $request->validate($rules);
        $item->update($validated);

        AuditService::log("UPDATE_DICO_{$type}", $item->getTable(), $item->id, $before, $item->toArray());

        return response()->json($item);
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        $modelClass = DictionnaireService::getModelClass($type);

        if (!$modelClass) {
            return response()->json(['message' => "Type '{$type}' invalide."], 404);
        }

        $item = $modelClass::findOrFail($id);

        AuditService::log("DELETE_DICO_{$type}", $item->getTable(), $item->id, $item->toArray());

        try {
            $item->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'Impossible de supprimer cet élément car il est utilisé ailleurs.',
            ], 422);
        }

        return response()->json(['message' => 'Élément supprimé.']);
    }

    public function types(): JsonResponse
    {
        return response()->json(DictionnaireService::getTypes());
    }
}