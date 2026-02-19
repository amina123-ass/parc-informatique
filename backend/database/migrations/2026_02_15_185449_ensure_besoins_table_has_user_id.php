<?php
// database/migrations/XXXX_XX_XX_ensure_besoins_table_has_user_id.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vérifier si la colonne user_id existe déjà
        if (!Schema::hasColumn('besoins', 'user_id')) {
            Schema::table('besoins', function (Blueprint $table) {
                // Ajouter user_id après id
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->onDelete('cascade');
                
                // Ajouter un index pour améliorer les performances
                $table->index('user_id');
            });
            
            // Si nécessaire, mettre à jour les enregistrements existants
            // pour lier les besoins aux utilisateurs via le service_id
            DB::statement("
                UPDATE besoins b
                INNER JOIN users u ON u.service_id = b.service_id
                SET b.user_id = u.id
                WHERE b.user_id IS NULL
                LIMIT 1
            ");
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('besoins', 'user_id')) {
            Schema::table('besoins', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropIndex(['user_id']);
                $table->dropColumn('user_id');
            });
        }
    }
};