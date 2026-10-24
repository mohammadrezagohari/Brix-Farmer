<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CreateAccess extends Command
{
    protected $signature = 'access:create {email} {--admin} {--trader} {--farmer}';

    protected $description = 'Create a new administrator, trader or farmer with an interactive password';

    public function handle(): int
    {
        $email = $this->argument('email');
        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || User::where('email', $email)->exists() || count(array_filter([$this->option('admin'), $this->option('trader'), $this->option('farmer')])) !== 1) {
            $this->error('Use a new valid email and exactly one of --admin, --trader or --farmer. Existing accounts are never overwritten.');

            return self::FAILURE;
        }
        $name = $this->ask('Name');
        $organization = $this->option('admin') ? null : $this->ask($this->option('trader') ? 'Trading organization name' : 'Farm organization name');
        $password = $this->secret('Password (at least 12 characters)');
        if (! is_string($name) || trim($name) === '' || mb_strlen($name) > 100 || ($organization !== null && (! is_string($organization) || trim($organization) === '' || mb_strlen($organization) > 160)) || ! is_string($password) || mb_strlen($password) < 12) {
            $this->error('Invalid name, organization or password.');

            return self::FAILURE;
        }
        DB::transaction(function () use ($email, $name, $password, $organization) {
            $user = new User(['name' => $name, 'email' => $email, 'password' => Hash::make($password)]);
            $user->is_platform_admin = (bool) $this->option('admin');
            $user->save();
            if ($organization !== null) {
                $id = DB::table('organizations')->insertGetId(['name' => $organization, 'created_at' => now(), 'updated_at' => now()]);
                DB::table('organization_memberships')->insert(['organization_id' => $id, 'user_id' => $user->id, 'role' => $this->option('trader') ? 'trader' : 'farmer', 'created_at' => now(), 'updated_at' => now()]);
            }
        });
        $this->info('Account created. Sign in using the email and password you entered.');

        return self::SUCCESS;
    }
}
