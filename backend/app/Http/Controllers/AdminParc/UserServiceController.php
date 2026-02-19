<?php

namespace App\Http\Controllers\AdminParc;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminParc\QuickCreateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;

class UserServiceController extends Controller
{
    /**
     * Users d'un service (pour dropdown affectation)
     */
    public function usersByService(int $serviceId): JsonResponse
    {
        $users = User::where('service_id', $serviceId)
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom', 'fonction', 'account_active']);

        return response()->json($users);
    }

    /**
     * Quick create: user minimal pour affectation
     */
    public function quickCreate(QuickCreateUserRequest $request): JsonResponse
    {
        $matricule = $request->matricule;

        $user = User::create([
            'matricule'         => $matricule,
            'nom'               => $request->nom,
            'prenom'            => $request->prenom,
            'email'             => strtolower($matricule) . '@placeholder.local',
            'password'          => null,
            'email_verified_at' => null,
            'account_active'    => false,
            'role_id'           => null,
            'service_id'        => $request->service_id,
        ]);

        AuditService::log('QUICK_CREATE_USER', 'User', $user->id, null, $user->toArray());

        return response()->json([
            'message' => 'Utilisateur créé (en attente d\'activation par AdminSI).',
            'user'    => $user,
        ], 201);
    }
}