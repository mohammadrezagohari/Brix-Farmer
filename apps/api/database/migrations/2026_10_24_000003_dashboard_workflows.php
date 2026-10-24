<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('suspended')->default(false));
        Schema::table('organizations', function (Blueprint $t) {
            $t->json('profile')->nullable();
            $t->text('review_reason')->nullable();
        });
        Schema::create('product_categories', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
            $t->timestamps();
        });
        Schema::create('listings', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained();
            $t->foreignId('inventory_lot_id')->nullable()->constrained();
            $t->foreignId('product_category_id')->nullable()->constrained();
            $t->string('title');
            $t->string('status')->default('draft')->index();
            $t->json('details');
            $t->text('review_reason')->nullable();
            $t->timestamps();
            $t->index(['organization_id', 'status']);
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->foreignId('organization_id')->nullable()->constrained();
            $t->string('action');
            $t->string('subject');
            $t->json('details');
            $t->timestamp('created_at');
        });
        Schema::create('trade_partners', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained();
            $t->string('company');
            $t->string('country', 2);
            $t->string('contact')->nullable();
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->index(['organization_id', 'company']);
        });
        Schema::create('opportunities', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained();
            $t->foreignId('trade_partner_id')->constrained();
            $t->string('title');
            $t->string('stage')->default('new');
            $t->text('next_action')->nullable();
            $t->date('due_at')->nullable();
            $t->timestamps();
            $t->index(['organization_id', 'stage']);
        });
    }

    public function down(): void
    {
        foreach (['opportunities', 'trade_partners', 'audit_logs', 'listings', 'product_categories'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('organizations', fn (Blueprint $t) => $t->dropColumn(['profile', 'review_reason']));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('suspended'));
    }
};
