<?php
// database/migrations/xxxx_xx_xx_update_type_enum_in_sous_categorie_attributes.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\{Schema, DB};

return new class extends Migration
{
    public function up(): void
    {
        // Modifier l'ENUM pour inclure les nouveaux types
        DB::statement("
            ALTER TABLE sous_categorie_attributes 
            MODIFY COLUMN `type` ENUM(
                'text',
                'number',
                'date',
                'select',
                'boolean',
                'textarea',
                'api_select'
            ) NOT NULL DEFAULT 'text'
        ");
    }

    public function down(): void
    {
        // Revenir aux types d'origine
        DB::statement("
            ALTER TABLE sous_categorie_attributes 
            MODIFY COLUMN `type` ENUM(
                'text',
                'number',
                'select',
                'api_select'
            ) NOT NULL DEFAULT 'text'
        ");
    }
};