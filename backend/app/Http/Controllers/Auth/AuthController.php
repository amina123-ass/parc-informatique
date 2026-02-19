<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\{RegisterRequest, VerifySetupRequest, LoginRequest};
use App\Models\{User, EmailVerificationToken, PasswordResetTokenCustom, SecurityQuestion};
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Hash, Mail, DB, RateLimiter};
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // ─────────────────────────────────────────────────
    // 1) REGISTER (sans mot de passe)
    // ─────────────────────────────────────────────────
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'matricule' => $request->matricule,
            'nom'       => $request->nom,
            'prenom'    => $request->prenom,
            'email'     => $request->email,
            'fonction'  => $request->fonction,
        ]);

        // Génération token vérification
        $plainToken = Str::random(64);

        EmailVerificationToken::create([
            'user_id'    => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addHours(24),
            'created_at' => now(),
        ]);

        // Envoi email
        $verifyUrl = config('app.frontend_url') . '/verify-setup?token=' . $plainToken;

        Mail::raw(
            "Bonjour {$user->prenom},\n\nCliquez ici pour vérifier votre email et configurer votre compte :\n{$verifyUrl}\n\nCe lien expire dans 24h.",
            function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Vérification de votre compte - Parc Informatique');
            }
        );

        AuditService::log('REGISTER', 'User', $user->id);

        return response()->json([
            'message' => 'Si votre email est valide, vous recevrez un lien de vérification.',
        ], 201);
    }

    // ─────────────────────────────────────────────────
    // 2) VERIFY EMAIL + SETUP PASSWORD + 3 QUESTIONS
    // ─────────────────────────────────────────────────
    public function verifySetup(VerifySetupRequest $request): JsonResponse
    {
        $tokenHash = hash('sha256', $request->token);

        $record = EmailVerificationToken::where('token_hash', $tokenHash)->first();

        if (!$record || $record->isExpired()) {
            return response()->json(['message' => 'Token invalide ou expiré.'], 422);
        }

        $user = $record->user;

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email déjà vérifié.'], 422);
        }

        DB::transaction(function () use ($user, $request, $record) {
            $user->update([
                'email_verified_at' => now(),
                'password'          => Hash::make($request->password),
            ]);

            foreach ($request->questions as $q) {
                SecurityQuestion::create([
                    'user_id'     => $user->id,
                    'question'    => $q['question'],
                    'answer_hash' => Hash::make(Str::lower(trim($q['answer']))),
                ]);
            }

            $record->delete();
        });

        AuditService::log('VERIFY_SETUP', 'User', $user->id);

        return response()->json([
            'message' => 'Compte vérifié avec succès. En attente d\'activation par l\'administrateur.',
        ]);
    }

    // ─────────────────────────────────────────────────
    // 3) LOGIN
    // ─────────────────────────────────────────────────
    public function login(LoginRequest $request): JsonResponse
    {
        // Rate limiting
        $key = 'login:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ], 429);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            RateLimiter::hit($key, 60);
            return response()->json(['message' => 'Identifiants incorrects.'], 401);
        }

        RateLimiter::clear($key);

        /** @var User $user */
        $user = auth('api')->user();

        if (!$user->email_verified_at) {
            auth('api')->logout();
            return response()->json(['message' => 'Votre email n\'est pas vérifié.'], 403);
        }

        if (!$user->account_active) {
            auth('api')->logout();
            return response()->json(['message' => 'Votre compte n\'est pas encore activé.'], 403);
        }

        if (!$user->role_id || !$user->service_id) {
            auth('api')->logout();
            return response()->json(['message' => 'Votre compte n\'est pas encore configuré (rôle/service manquant).'], 403);
        }

        AuditService::log('LOGIN', 'User', $user->id);

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user'         => [
                'id'      => $user->id,
                'nom'     => $user->nom,
                'prenom'  => $user->prenom,
                'email'   => $user->email,
                'role'    => $user->role?->nom,
                'service' => $user->service?->nom,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────
    // 4) LOGOUT
    // ─────────────────────────────────────────────────
    public function logout(): JsonResponse
    {
        AuditService::log('LOGOUT', 'User', auth('api')->id());
        auth('api')->logout();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    // ─────────────────────────────────────────────────
    // 5) REFRESH
    // ─────────────────────────────────────────────────
    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    // ─────────────────────────────────────────────────
    // 6) ME
    // ─────────────────────────────────────────────────
    public function me(): JsonResponse
    {
        $user = auth('api')->user();
        $user->load(['role', 'service']);

        return response()->json([
            'id'        => $user->id,
            'matricule' => $user->matricule,
            'nom'       => $user->nom,
            'prenom'    => $user->prenom,
            'email'     => $user->email,
            'fonction'  => $user->fonction,
            'role'      => $user->role?->nom,
            'service'   => $user->service?->nom,
        ]);
    }

    // ─────────────────────────────────────────────────
    // 7) FORGOT PASSWORD - EMAIL
    // ─────────────────────────────────────────────────
    public function forgotByEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Réponse générique (anti-enumeration)
        if (!$user || !$user->email_verified_at) {
            return response()->json([
                'message' => 'Si l\'adresse existe, un email de réinitialisation a été envoyé.',
            ]);
        }

        // Supprimer anciens tokens
        PasswordResetTokenCustom::where('user_id', $user->id)->delete();

        $plainToken = Str::random(64);

        PasswordResetTokenCustom::create([
            'user_id'    => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(15),
            'created_at' => now(),
        ]);

        $resetUrl = config('app.frontend_url') . '/reset?token=' . $plainToken . '&method=email';

        Mail::raw(
            "Bonjour {$user->prenom},\n\nCliquez ici pour réinitialiser votre mot de passe :\n{$resetUrl}\n\nCe lien expire dans 15 minutes.",
            function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Réinitialisation du mot de passe - Parc Informatique');
            }
        );

        return response()->json([
            'message' => 'Si l\'adresse existe, un email de réinitialisation a été envoyé.',
        ]);
    }

    // ─────────────────────────────────────────────────
    // 8) RESET PASSWORD - EMAIL
    // ─────────────────────────────────────────────────
    public function resetByEmail(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $tokenHash = hash('sha256', $request->token);
        $record = PasswordResetTokenCustom::where('token_hash', $tokenHash)->first();

        if (!$record || $record->isExpired()) {
            return response()->json(['message' => 'Token invalide ou expiré.'], 422);
        }

        $user = $record->user;
        $user->update(['password' => Hash::make($request->password)]);
        $record->delete();

        AuditService::log('PASSWORD_RESET_EMAIL', 'User', $user->id);

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    // ─────────────────────────────────────────────────
    // 9) FORGOT PASSWORD - SECURITY QUESTIONS (get questions)
    // ─────────────────────────────────────────────────
    public function forgotBySecurity(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $key = 'forgot-security:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json(['message' => 'Trop de tentatives.'], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->email_verified_at) {
            RateLimiter::hit($key, 60);
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        $questions = $user->securityQuestions()->pluck('question', 'id');

        return response()->json(['questions' => $questions]);
    }

    // ─────────────────────────────────────────────────
    // 10) RESET PASSWORD - SECURITY QUESTIONS
    // ─────────────────────────────────────────────────
    public function resetBySecurity(Request $request): JsonResponse
    {
        $request->validate([
            'email'             => 'required|email',
            'answers'           => 'required|array|size:3',
            'answers.*.id'      => 'required|integer',
            'answers.*.answer'  => 'required|string',
            'password'          => 'required|string|min:8|confirmed',
        ]);

        $key = 'reset-security:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json(['message' => 'Trop de tentatives. Réessayez plus tard.'], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            RateLimiter::hit($key, 300);
            return response()->json(['message' => 'Erreur de vérification.'], 422);
        }

        // Vérifier les 3 réponses
        foreach ($request->answers as $a) {
            $sq = SecurityQuestion::where('id', $a['id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$sq || !Hash::check(Str::lower(trim($a['answer'])), $sq->answer_hash)) {
                RateLimiter::hit($key, 300);
                return response()->json(['message' => 'Réponses de sécurité incorrectes.'], 422);
            }
        }

        $user->update(['password' => Hash::make($request->password)]);

        RateLimiter::clear($key);
        AuditService::log('PASSWORD_RESET_SECURITY', 'User', $user->id);

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }
}