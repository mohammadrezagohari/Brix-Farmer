<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('verification_status')->default('pending');
            $t->boolean('suspended')->default(false);
            $t->timestamps();
        });
        Schema::create('organization_memberships', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained();
            $t->foreignId('user_id')->constrained();
            $t->string('role');
            $t->unique(['organization_id', 'user_id']);
            $t->timestamps();
        });
        Schema::create('inventory_lots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained();
            $t->string('product');
            $t->string('origin_country', 2);
            $t->decimal('on_hand_kg', 18, 3);
            $t->decimal('allocated_kg', 18, 3)->default(0);
            $t->decimal('minimum_order_kg', 18, 3);
            $t->timestamps();
        });
        Schema::create('reservations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_lot_id')->constrained();
            $t->foreignId('organization_id')->constrained();
            $t->string('idempotency_key', 100);
            $t->decimal('quantity_kg', 18, 3);
            $t->string('status')->default('active');
            $t->timestamp('expires_at')->index();
            $t->unique(['organization_id', 'idempotency_key']);
            $t->timestamps();
        });
        Schema::create('stock_movements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('inventory_lot_id')->constrained();
            $t->foreignId('reservation_id')->nullable()->constrained();
            $t->string('type');
            $t->decimal('quantity_kg', 18, 3);
            $t->timestamp('created_at');
        });
        Schema::create('outbox_events', function (Blueprint $t) {
            $t->id();
            $t->string('type');
            $t->json('payload');
            $t->timestamp('created_at');
            $t->timestamp('published_at')->nullable();
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE inventory_lots ADD CONSTRAINT lot_quantities CHECK (on_hand_kg >= 0 AND allocated_kg >= 0 AND allocated_kg <= on_hand_kg AND minimum_order_kg > 0)');
            DB::statement('ALTER TABLE reservations ADD CONSTRAINT positive_reservation CHECK (quantity_kg > 0)');
        }
    }

    public function down(): void
    {
        foreach (['outbox_events', 'stock_movements', 'reservations', 'inventory_lots', 'organization_memberships', 'organizations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
