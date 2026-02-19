<?php
// database/migrations/XXXX_XX_XX_create_sous_categorie_attributes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sous_categorie_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sous_category_id')->constrained('sous_categories')->onDelete('cascade');
            $table->string('key'); // Ex: 'processeur', 'ram', 'couleur'
            $table->string('label'); // Ex: 'Processeur', 'RAM (Go)'
            $table->enum('type', ['text', 'number', 'select', 'api_select'])->default('text');
            $table->json('options')->nullable(); // Pour select: ["option1", "option2"]
            $table->string('data_key')->nullable(); // Pour api_select: 'cartouches', 'systemesExploitation'
            $table->string('label_field')->nullable(); // Pour api_select: 'nom', 'reference'
            $table->string('value_field')->nullable(); // Pour api_select: 'id', 'nom'
            $table->integer('ordre')->default(0);
            $table->boolean('required')->default(false);
            $table->timestamps();

            $table->unique(['sous_category_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sous_categorie_attributes');
    }
};