<?php
// database/migrations/2024_xx_xx_create_pannes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pannes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materiel_id')->constrained('materiels')->onDelete('cascade');
            $table->foreignId('user_declarant_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null');
            $table->foreignId('entite_id')->nullable()->constrained('entites')->onDelete('set null');
            
            $table->string('numero_ticket')->unique();
            $table->enum('type_panne', ['materielle', 'logicielle', 'reseau', 'autre']);
            $table->enum('priorite', ['faible', 'moyenne', 'urgente'])->default('moyenne');
            $table->enum('statut', ['declaree', 'en_cours', 'resolue', 'annulee'])->default('declaree');
            
            $table->text('description');
            $table->text('diagnostic')->nullable();
            $table->text('solution')->nullable();
            
            $table->date('date_declaration');
            $table->date('date_prise_en_charge')->nullable();
            $table->date('date_resolution')->nullable();
            
            $table->foreignId('technicien_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('commentaire_technicien')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['statut', 'priorite']);
            $table->index(['service_id', 'statut']);
            $table->index(['entite_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pannes');
    }
};