<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('schools', 'user_id')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('email')->constrained()->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            if (Schema::hasColumn('schools', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
