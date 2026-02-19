<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affectations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materiel_id')->constrained('materiels')->restrictOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('numero_inventaire')->nullable();
            $table->integer('annee_inventaire')->nullable();
            $table->string('bon_sortie')->nullable();
            $table->string('nature')->nullable();
            $table->date('date_affectation');
            $table->date('date_retour')->nullable();
            $table->enum('status', ['ACTIVE', 'RETURNED'])->default('ACTIVE');
            $table->timestamps();

            $table->index(['materiel_id', 'status']);
            $table->index('service_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affectations');
    }
};