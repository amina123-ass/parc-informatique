<?php
// app/Models/Panne.php - VERSION CORRIGÉE

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Dico\Entite; // ✅ AJOUTER CET IMPORT

class Panne extends Model
{
    use HasFactory;

    protected $fillable = [
        'materiel_id',
        'user_declarant_id',
        'service_id',
        'entite_id',
        'technicien_id',
        'numero_ticket',
        'type_panne',
        'priorite',
        'statut',
        'description',
        'diagnostic',
        'solution',
        'commentaire_technicien',
        'date_declaration',
        'date_prise_en_charge',
        'date_resolution',
    ];

    protected $casts = [
        'date_declaration' => 'date',
        'date_prise_en_charge' => 'date',
        'date_resolution' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($panne) {
            if (empty($panne->numero_ticket)) {
                $panne->numero_ticket = self::generateNumeroTicket();
            }
        });
    }

    public static function generateNumeroTicket(): string
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return 'PN-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    // ═══════════════════════════════════════════════════════
    // RELATIONS
    // ═══════════════════════════════════════════════════════

    public function materiel()
    {
        return $this->belongsTo(Materiel::class);
    }

    public function declarant()
    {
        return $this->belongsTo(User::class, 'user_declarant_id');
    }

    public function technicien()
    {
        return $this->belongsTo(User::class, 'technicien_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    // ✅ CORRECTION ICI - Utiliser le bon namespace
    public function entite()
    {
        return $this->belongsTo(Entite::class); // ✅ Grâce à l'import en haut
    }

    // ═══════════════════════════════════════════════════════
    // MÉTHODES HELPER
    // ═══════════════════════════════════════════════════════

    public function isResolue(): bool
    {
        return $this->statut === 'resolue';
    }

    public function isEnCours(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function delaiResolution(): ?int
    {
        if (!$this->date_resolution || !$this->date_declaration) {
            return null;
        }

        return $this->date_declaration->diffInDays($this->date_resolution);
    }
}