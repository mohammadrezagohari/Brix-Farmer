<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DashboardQaSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('QA seed only.');
        }
        $password = getenv('E2E_PASSWORD');
        if (! $password || strlen($password) < 12) {
            throw new \RuntimeException('Set E2E_PASSWORD to an ephemeral QA password.');
        }
        foreach (['admin', 'farmer', 'trader'] as $role) {
            $email = $role.'-dashboard-qa@example.test';
            abort_if(User::where('email', $email)->exists(), 409, 'QA account already exists; use the previously configured password.');
            DB::transaction(function () use ($email, $role, $password) {
                $u = new User(['name' => 'Synthetic QA '.$role, 'email' => $email, 'password' => Hash::make($password)]);
                $u->is_platform_admin = $role === 'admin';
                $u->save();
                if ($role !== 'admin') {
                    $id = DB::table('organizations')->insertGetId(['name' => 'Synthetic QA '.$role, 'created_at' => now(), 'updated_at' => now()]);
                    DB::table('organization_memberships')->insert(['organization_id' => $id, 'user_id' => $u->id, 'role' => $role, 'created_at' => now(), 'updated_at' => now()]);
                }
            });
        }
    }
}
