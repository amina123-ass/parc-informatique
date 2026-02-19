<?php
// database/migrations/XXXX_XX_XX_add_entite_id_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Ajouter la colonne entite_id après service_id
            $table->foreignId('entite_id')->nullable()->after('service_id')->constrained('entites')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['entite_id']);
            $table->dropColumn('entite_id');
        });
    }
};