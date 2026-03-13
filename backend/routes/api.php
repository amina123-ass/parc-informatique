<?php
// routes/api.php - VERSION FINALE CORRIGÉE

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\{DashboardController, UserController, RoleController, ServiceController, DictionnaireController};
use App\Http\Controllers\AdminParc\{
    MaterielController, 
    AffectationController, 
    CategorieController, 
    UserServiceController, 
    BesoinController,
    SousCategorieController,
    DashboardAdminParcController,
    PanneController  
};
use App\Http\Controllers\Directeur\{
    DashboardDirecteurController,
    MaterielDirecteurController,
    BesoinDirecteurController,
    PanneDirecteurController
};
use App\Http\Controllers\User\{
    DashboardUserController,
    MaterielUserController,
    BesoinUserController,
    PanneUserController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Routes (publiques)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('register',        [AuthController::class, 'register']);
    Route::post('verify-setup',    [AuthController::class, 'verifySetup']);
    Route::post('login',           [AuthController::class, 'login']);
    Route::post('forgot/email',    [AuthController::class, 'forgotByEmail']);
    Route::post('reset/email',     [AuthController::class, 'resetByEmail']);
    Route::post('forgot/security', [AuthController::class, 'forgotBySecurity']);
    Route::post('reset/security',  [AuthController::class, 'resetBySecurity']);
});

/*
|--------------------------------------------------------------------------
| Routes authentifiées
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {

    Route::post('auth/logout',  [AuthController::class, 'logout']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::get('auth/me',       [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | ADMIN SI Routes
    |----------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware('role:ADMIN_SI')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('users',                      [UserController::class, 'index']);
        Route::get('users/{user}',               [UserController::class, 'show']);
        Route::patch('users/{user}/activation',   [UserController::class, 'activation']);
        Route::patch('users/{user}/role',         [UserController::class, 'assignRole']);
        Route::patch('users/{user}/service',      [UserController::class, 'assignService']);

        Route::get('roles',           [RoleController::class, 'index']);
        Route::post('roles',          [RoleController::class, 'store']);
        Route::patch('roles/{role}',  [RoleController::class, 'update']);
        Route::delete('roles/{role}', [RoleController::class, 'destroy']);

        Route::get('services',               [ServiceController::class, 'index']);
        Route::post('services',              [ServiceController::class, 'store']);
        Route::patch('services/{service}',   [ServiceController::class, 'update']);
        Route::delete('services/{service}',  [ServiceController::class, 'destroy']);

        Route::get('dico/types',             [DictionnaireController::class, 'types']);
        Route::get('dico/{type}',            [DictionnaireController::class, 'index']);
        Route::post('dico/{type}',           [DictionnaireController::class, 'store']);
        Route::patch('dico/{type}/{id}',     [DictionnaireController::class, 'update']);
        Route::delete('dico/{type}/{id}',    [DictionnaireController::class, 'destroy']);
    });

    /*
    |----------------------------------------------------------------------
    | ADMIN PARC Routes
    |----------------------------------------------------------------------
    */
    Route::prefix('admin-parc')->middleware('role:ADMIN_PARC')->group(function () {
        Route::get('dashboard', [DashboardAdminParcController::class, 'index']);

        // Catégories (read-only)
        Route::get('categories',                          [CategorieController::class, 'index']);
        Route::get('categories/{id}/sub-categories',      [CategorieController::class, 'subCategories']);
        Route::get('sub-categories/{id}',                 [CategorieController::class, 'showSubCategory']);

        // Sous-catégories
        Route::get('sous-categories',         [SousCategorieController::class, 'index']);
        Route::post('sous-categories',        [SousCategorieController::class, 'store']);
        Route::get('sous-categories/{id}',    [SousCategorieController::class, 'show']);
        Route::patch('sous-categories/{id}',  [SousCategorieController::class, 'update']);
        Route::delete('sous-categories/{id}', [SousCategorieController::class, 'destroy']);

        // Matériels
        Route::get('materiels',                [MaterielController::class, 'index']);
        Route::get('materiels/{id}',           [MaterielController::class, 'show']);
        Route::post('materiels',               [MaterielController::class, 'store']);
        Route::patch('materiels/{materiel}',   [MaterielController::class, 'update']);
        Route::patch('materiels/{materiel}/reforme', [MaterielController::class, 'reforme']);
        Route::delete('materiels/{materiel}',  [MaterielController::class, 'destroy']);
        Route::patch('materiels/{id}/restore', [MaterielController::class, 'restore']);

        // Affectations
        Route::get('affectations',                       [AffectationController::class, 'index']);
        Route::post('affectations',                      [AffectationController::class, 'store']);
        Route::patch('affectations/{affectation}/return', [AffectationController::class, 'returnMateriel']);

        // Users par service + quick-create + liste complète
        Route::get('services/{id}/users',  [UserServiceController::class, 'usersByService']);
        Route::post('users/quick-create',  [UserServiceController::class, 'quickCreate']);
        
        // ✅ AJOUT: Route pour récupérer tous les utilisateurs actifs
        Route::get('users', function() {
            return \App\Models\User::where('account_active', true)
                ->with('service')
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get(['id', 'matricule', 'nom', 'prenom', 'email', 'service_id']);
        });
        Route::get('types-connexion', fn() => \App\Models\Dico\TypeConnexion::orderBy('nom')->get());
        // Données référentielles
        Route::get('marques',                fn() => \App\Models\Dico\Marque::orderBy('nom')->get());
        Route::get('services',               fn() => \App\Models\Service::orderBy('nom')->get());
        Route::get('cartouches',             fn() => \App\Models\Dico\Cartouche::orderBy('reference')->get());
        Route::get('systemes-exploitation',  fn() => \App\Models\Dico\SystemExploitation::orderBy('nom')->get());
        Route::get('entites',                fn() => \App\Models\Dico\Entite::orderBy('nom')->get());

        // Besoins
        Route::get('besoins/dashboard', [BesoinController::class, 'dashboard']);
        Route::get('besoins',              [BesoinController::class, 'index']);
        Route::get('besoins/{id}',         [BesoinController::class, 'show']);
        Route::post('besoins',             [BesoinController::class, 'store']);
        Route::patch('besoins/{besoin}',   [BesoinController::class, 'update']);
        Route::delete('besoins/{besoin}',  [BesoinController::class, 'destroy']);
        Route::patch('besoins/{besoin}/en-cours', [BesoinController::class, 'enCours']);
        Route::patch('besoins/{besoin}/valider',  [BesoinController::class, 'valider']);
        Route::patch('besoins/{besoin}/rejeter',  [BesoinController::class, 'rejeter']);
        Route::get('besoins-notifications',     [BesoinController::class, 'notifications']);
        Route::patch('notifications/{id}/read', [BesoinController::class, 'markNotificationRead']);

        // Pannes
        Route::prefix('pannes')->group(function () {
            Route::get('dashboard', [PanneController::class, 'dashboard']);
            Route::get('techniciens', [PanneController::class, 'techniciens']);
            Route::get('/', [PanneController::class, 'index']);
            Route::get('{id}', [PanneController::class, 'show']);
            Route::post('/', [PanneController::class, 'store']);
            Route::patch('{id}', [PanneController::class, 'update']);
            Route::delete('{id}', [PanneController::class, 'destroy']);
            Route::patch('{id}/prise-en-charge', [PanneController::class, 'priseEnCharge']);
            Route::patch('{id}/resoudre', [PanneController::class, 'resoudre']);
            Route::patch('{id}/annuler', [PanneController::class, 'annuler']);
        });
    });

    /*
    |----------------------------------------------------------------------
    | DIRECTEUR Routes
    |----------------------------------------------------------------------
    */
    Route::prefix('directeur')->middleware('role:DIRECTEUR,ADJOINT_DIRECTEUR')->group(function () {
        Route::get('dashboard', [DashboardDirecteurController::class, 'index']);

        Route::prefix('materiels')->group(function () {
            Route::get('affectations', [MaterielDirecteurController::class, 'affectations']);
            Route::get('statistiques-entite', [MaterielDirecteurController::class, 'statistiquesParEntite']);
            Route::get('export', [MaterielDirecteurController::class, 'export']);
        });

        Route::prefix('besoins')->group(function () {
            Route::get('/', [BesoinDirecteurController::class, 'index']);
            Route::get('statistiques', [BesoinDirecteurController::class, 'statistiques']);
        });

        Route::prefix('pannes')->group(function () {
            Route::get('/', [PanneDirecteurController::class, 'index']);
            Route::get('dashboard', [PanneDirecteurController::class, 'dashboard']);
            Route::get('statistiques', [PanneDirecteurController::class, 'statistiques']);
            Route::get('{id}', [PanneDirecteurController::class, 'show']);
        });

        Route::get('entites', fn() => \App\Models\Dico\Entite::orderBy('nom')->get());
        Route::get('services', fn() => \App\Models\Service::with('entite')->orderBy('nom')->get());
    });
    Route::prefix('user')->middleware('role:USER,UTILISATEUR')->group(function () {
        
        // Dashboard
        Route::get('dashboard', [DashboardUserController::class, 'index']);

        // Mon matériel
        Route::prefix('materiels')->group(function () {
            Route::get('/', [MaterielUserController::class, 'mesMateriels']);
            Route::get('{id}', [MaterielUserController::class, 'show']);
        });

        // Mes besoins
        Route::prefix('besoins')->group(function () {
            Route::get('/', [BesoinUserController::class, 'index']);
            Route::get('statistiques', [BesoinUserController::class, 'statistiques']);
            Route::get('{id}', [BesoinUserController::class, 'show']);
            Route::post('/', [BesoinUserController::class, 'store']);
            Route::patch('{id}/cancel', [BesoinUserController::class, 'cancel']);
        });

        // Mes pannes
        Route::prefix('pannes')->group(function () {
            Route::get('/', [PanneUserController::class, 'index']);
            Route::get('statistiques', [PanneUserController::class, 'statistiques']);
            Route::get('mes-materiels', [PanneUserController::class, 'mesMateriels']);
            Route::get('{id}', [PanneUserController::class, 'show']);
            Route::post('/', [PanneUserController::class, 'store']);
            Route::patch('{id}/cancel', [PanneUserController::class, 'cancel']);
        });
    });
});