<?php

namespace App\Models;

use App\Models\Dico\Entite;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class Besoin extends Model
{
    protected $fillable = [
        'utilisateur_id', 'service_id', 'entite_id',
        'type_besoin', 'designation', 'description',
        'date_demande', 'statut', 'date_reponse',
        'motif_rejet', 'commentaire_responsable', 'priorite',
    ];

    protected $casts = [
        'date_demande' => 'date',
        'date_reponse' => 'date',
    ];

    // ─── Relations ──────────────────────────────────
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function entite()
    {
        return $this->belongsTo(Entite::class);
    }

    public function historiques()
    {
        return $this->hasMany(BesoinHistorique::class)->orderBy('date_action', 'desc');
    }

    // ─── Scopes ─────────────────────────────────────
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours');
    }

    public function scopeValide($query)
    {
        return $query->where('statut', 'valide');
    }

    public function scopeRejete($query)
    {
        return $query->where('statut', 'rejete');
    }

    // ─── Helpers ────────────────────────────────────
    public function isEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }

    public function isTraite(): bool
    {
        return in_array($this->statut, ['valide', 'rejete']);
    }

    /**
     * Change statut + crée historique + notifie
     */
    public function changerStatut(string $nouveauStatut, int $userId, ?string $commentaire = null): void
    {
        $ancienStatut = $this->statut;

        $this->update(['statut' => $nouveauStatut]);

        BesoinHistorique::create([
            'besoin_id'      => $this->id,
            'ancien_statut'  => $ancienStatut,
            'nouveau_statut' => $nouveauStatut,
            'commentaire'    => $commentaire,
            'user_action_id' => $userId,
            'date_action'    => now(),
        ]);

        // Notification — safe même si la table n'existe pas
        try {
            if (Schema::hasTable('notifications')) {
                Notification::create([
                    'user_id' => $this->utilisateur_id,
                    'type'    => 'BESOIN_STATUT',
                    'title'   => $this->getTitreNotification($nouveauStatut),
                    'message' => $this->getMessageNotification($nouveauStatut, $commentaire),
                    'data'    => json_encode(['besoin_id' => $this->id, 'statut' => $nouveauStatut]),
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Notification besoin non envoyée: ' . $e->getMessage());
        }
    }

    private function getTitreNotification(string $statut): string
    {
        return match ($statut) {
            'en_cours' => 'Besoin en cours de traitement',
            'valide'   => 'Besoin validé',
            'rejete'   => 'Besoin rejeté',
            default    => 'Mise à jour de votre besoin',
        };
    }

    private function getMessageNotification(string $statut, ?string $commentaire): string
    {
        $base = "Votre demande \"{$this->designation}\" a été ";
        $msg = match ($statut) {
            'en_cours' => $base . 'prise en charge.',
            'valide'   => $base . 'validée.',
            'rejete'   => $base . 'rejetée.',
            default    => $base . 'mise à jour.',
        };

        if ($commentaire) {
            $msg .= " Commentaire: {$commentaire}";
        }

        return $msg;
    }
}