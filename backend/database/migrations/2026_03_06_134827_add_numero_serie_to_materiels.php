<?php
// database/migrations/xxxx_xx_xx_add_numero_serie_to_materiels.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->string('numero_serie', 100)->nullable()->after('model');
        });
    }

    public function down(): void
    {
        Schema::table('materiels', function (Blueprint $table) {
            $table->dropColumn('numero_serie');
        });
    }
};
