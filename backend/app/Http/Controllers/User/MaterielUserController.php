<?php
// app/Http/Controllers/User/MaterielUserController.php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Auth;

class MaterielUserController extends Controller
{
    /**
     * Liste du matériel affecté à l'utilisateur
     */
    public function mesMateriels(Request $request): JsonResponse
    {
        $query = Affectation::where('user_id', Auth::id())
            ->with([
                'materiel.categorie',
                'materiel.sousCategorie',
                'materiel.marque',
                'materiel.details',
                'service',
            ]);

        // Filtres
        if ($request->filled('statut')) {
            if ($request->statut === 'active') {
                $query->whereNull('date_retour');
            } elseif ($request->statut === 'returned') {
                $query->whereNotNull('date_retour');
            }
        } else {
            // Par défaut, afficher uniquement les affectations actives
            $query->whereNull('date_retour');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('materiel', function ($q) use ($search) {
                $q->where('model', 'like', "%{$search}%")
                  ->orWhereHas('marque', fn($mq) => $mq->where('nom', 'like', "%{$search}%"));
            });
        }

        $affectations = $query->orderBy('date_affectation', 'desc')
                              ->paginate($request->get('per_page', 25));

        // Ajouter un attribut virtuel 'statut' pour le frontend
        $affectations->getCollection()->transform(function ($affectation) {
            $affectation->statut = $affectation->date_retour ? 'returned' : 'active';
            return $affectation;
        });

        return response()->json($affectations);
    }

    /**
     * Détail d'un matériel affecté
     */
    public function show(int $id): JsonResponse
    {
        $affectation = Affectation::where('user_id', Auth::id())
            ->with([
                'materiel.categorie',
                'materiel.sousCategorie',
                'materiel.marque',
                'materiel.details',
                'service.entite',
            ])
            ->findOrFail($id);

        // Ajouter un attribut virtuel 'statut'
        $affectation->statut = $affectation->date_retour ? 'returned' : 'active';

        return response()->json($affectation);
    }
}