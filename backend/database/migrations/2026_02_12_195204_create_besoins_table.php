<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('besoins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utilisateur_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
            $table->foreignId('entite_id')->nullable()->constrained('entites')->nullOnDelete();
            $table->enum('type_besoin', ['PC', 'imprimante', 'cartouche', 'autre']);
            $table->string('designation');
            $table->text('description')->nullable();
            $table->date('date_demande');
            $table->enum('statut', ['en_attente', 'en_cours', 'valide', 'rejete'])->default('en_attente');
            $table->date('date_reponse')->nullable();
            $table->text('motif_rejet')->nullable();
            $table->text('commentaire_responsable')->nullable();
            $table->enum('priorite', ['faible', 'moyenne', 'urgente'])->default('moyenne');
            $table->timestamps();

            $table->index('statut');
            $table->index('service_id');
            $table->index('priorite');
            $table->index('date_demande');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('besoins');
    }
};