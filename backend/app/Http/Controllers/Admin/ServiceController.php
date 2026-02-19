<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = Service::with(['typeConnexion', 'commune', 'entite', 'structure'])
            ->withCount('users')
            ->orderBy('nom')
            ->get();

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nom'               => 'required|string|max:255',
            'type_connexion_id' => 'nullable|exists:type_connexions,id',
            'commune_id'        => 'nullable|exists:communes,id',
            'entite_id'         => 'nullable|exists:entites,id',
            'structure_id'      => 'nullable|exists:structures,id',
        ]);

        $service = Service::create($request->only([
            'nom', 'type_connexion_id', 'commune_id', 'entite_id', 'structure_id',
        ]));

        AuditService::log('CREATE_SERVICE', 'Service', $service->id, null, $service->toArray());

        return response()->json($service->load(['typeConnexion', 'commune', 'entite', 'structure']), 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $request->validate([
            'nom'               => 'required|string|max:255',
            'type_connexion_id' => 'nullable|exists:type_connexions,id',
            'commune_id'        => 'nullable|exists:communes,id',
            'entite_id'         => 'nullable|exists:entites,id',
            'structure_id'      => 'nullable|exists:structures,id',
        ]);

        $before = $service->toArray();
        $service->update($request->only([
            'nom', 'type_connexion_id', 'commune_id', 'entite_id', 'structure_id',
        ]));

        AuditService::log('UPDATE_SERVICE', 'Service', $service->id, $before, $service->toArray());

        return response()->json($service->load(['typeConnexion', 'commune', 'entite', 'structure']));
    }

    public function destroy(Service $service): JsonResponse
    {
        if ($service->users()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce service car des utilisateurs y sont rattachés.',
            ], 422);
        }

        AuditService::log('DELETE_SERVICE', 'Service', $service->id, $service->toArray());
        $service->delete();

        return response()->json(['message' => 'Service supprimé.']);
    }
}