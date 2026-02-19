<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('sous_category_id')->constrained('sous_categories')->restrictOnDelete();
            $table->foreignId('marque_id')->nullable()->constrained('marques')->nullOnDelete();
            $table->string('model');
            $table->date('date_achat');
            $table->date('garantie_fin')->nullable();
            $table->text('observation')->nullable();
            $table->decimal('prix_unitaire', 12, 2)->default(0);
            $table->enum('etat', ['EN_STOCK', 'AFFECTE', 'PANNE', 'REFORME'])->default('EN_STOCK');
            $table->boolean('reseau')->default(false);
            $table->date('date_reforme')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['category_id', 'sous_category_id']);
            $table->index('etat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiels');
    }
};