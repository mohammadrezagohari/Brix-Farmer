<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Synthetic seeding is restricted to local/testing.');
        }
        $password = bin2hex(random_bytes(20));
        $user = User::firstOrCreate(['email' => 'farmer@example.test'], ['name' => 'Synthetic Kerman Farmer', 'password' => Hash::make($password)]);
        $org = DB::table('organizations')->where('name', 'Synthetic Kerman Cooperative')->first();
        if (! $org) {
            DB::transaction(function () use ($user) {
                $db = DB::class;
                $id = $db::table('organizations')->insertGetId(['name' => 'Synthetic Kerman Cooperative', 'verification_status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
                $db::table('organization_memberships')->insert(['organization_id' => $id, 'user_id' => $user->id, 'role' => 'owner', 'created_at' => now(), 'updated_at' => now()]);
                $lot = $db::table('inventory_lots')->insertGetId(['organization_id' => $id, 'product' => 'Synthetic Kerman Pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '50000.000', 'minimum_order_kg' => '1000.000', 'created_at' => now(), 'updated_at' => now()]);
                $db::table('stock_movements')->insert(['inventory_lot_id' => $lot, 'type' => 'opening', 'quantity_kg' => '50000.000', 'created_at' => now()]);
            });
        }
    }
}
