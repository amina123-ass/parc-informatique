<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{User, Role, Service};
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'users_total'              => User::count(),
            'users_pending_activation' => User::where('account_active', false)
                                              ->whereNotNull('email_verified_at')
                                              ->count(),
            'roles_total'              => Role::count(),
            'services_total'           => Service::count(),
        ]);
    }
}