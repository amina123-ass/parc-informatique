<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\{JsonResponse, Request};

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['role', 'service']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('account_active')) {
            $query->where('account_active', $request->boolean('account_active'));
        }

        if ($request->get('role_id')) {
            $query->where('role_id', $request->get('role_id'));
        }

        if ($request->get('service_id')) {
            $query->where('service_id', $request->get('service_id'));
        }

        if ($request->get('pending')) {
            $query->where('account_active', false)
                  ->whereNotNull('email_verified_at');
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['role', 'service', 'securityQuestions:id,user_id,question']);

        return response()->json($user);
    }

    public function activation(Request $request, User $user): JsonResponse
    {
        $request->validate(['account_active' => 'required|boolean']);

        // Vérifications avant activation
        if ($request->account_active) {
            if (!$user->email_verified_at) {
                return response()->json(['message' => 'L\'email n\'est pas vérifié.'], 422);
            }
            if (!$user->role_id) {
                return response()->json(['message' => 'Aucun rôle attribué.'], 422);
            }
            if (!$user->service_id) {
                return response()->json(['message' => 'Aucun service attribué.'], 422);
            }
        }

        $before = ['account_active' => $user->account_active];
        $user->update(['account_active' => $request->account_active]);

        AuditService::log(
            $request->account_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
            'User', $user->id, $before, ['account_active' => $user->account_active]
        );

        return response()->json([
            'message' => $request->account_active
                ? 'Utilisateur activé avec succès.'
                : 'Utilisateur désactivé.',
            'user' => $user->fresh(['role', 'service']),
        ]);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $request->validate(['role_id' => 'required|exists:roles,id']);

        $before = ['role_id' => $user->role_id];
        $user->update(['role_id' => $request->role_id]);

        AuditService::log('ASSIGN_ROLE', 'User', $user->id, $before, ['role_id' => $user->role_id]);

        return response()->json([
            'message' => 'Rôle attribué.',
            'user'    => $user->fresh(['role', 'service']),
        ]);
    }

    public function assignService(Request $request, User $user): JsonResponse
    {
        $request->validate(['service_id' => 'required|exists:services,id']);

        $before = ['service_id' => $user->service_id];
        $user->update(['service_id' => $request->service_id]);

        AuditService::log('ASSIGN_SERVICE', 'User', $user->id, $before, ['service_id' => $user->service_id]);

        return response()->json([
            'message' => 'Service attribué.',
            'user'    => $user->fresh(['role', 'service']),
        ]);
    }
}