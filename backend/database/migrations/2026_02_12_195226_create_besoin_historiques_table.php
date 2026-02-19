<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('besoin_historiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('besoin_id')->constrained('besoins')->cascadeOnDelete();
            $table->string('ancien_statut')->nullable();
            $table->string('nouveau_statut');
            $table->text('commentaire')->nullable();
            $table->foreignId('user_action_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('date_action')->useCurrent();
            $table->timestamps();

            $table->index('besoin_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('besoin_historiques');
    }
};