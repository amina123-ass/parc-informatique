<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::withCount('users')->orderBy('nom')->get();
        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['nom' => 'required|string|max:50|unique:roles,nom']);

        $role = Role::create(['nom' => strtoupper($request->nom)]);

        AuditService::log('CREATE_ROLE', 'Role', $role->id, null, $role->toArray());

        return response()->json($role, 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $request->validate([
            'nom' => 'required|string|max:50|unique:roles,nom,' . $role->id,
        ]);

        $before = $role->toArray();
        $role->update(['nom' => strtoupper($request->nom)]);

        AuditService::log('UPDATE_ROLE', 'Role', $role->id, $before, $role->toArray());

        return response()->json($role);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce rôle car il est attribué à des utilisateurs.',
            ], 422);
        }

        AuditService::log('DELETE_ROLE', 'Role', $role->id, $role->toArray());
        $role->delete();

        return response()->json(['message' => 'Rôle supprimé.']);
    }
}