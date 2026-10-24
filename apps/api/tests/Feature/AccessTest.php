<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_cli_creates_an_organization_scoped_farmer(): void
    {
        $this->artisan('access:create farmer-access@example.test --farmer')->expectsQuestion('Name', 'Farmer')->expectsQuestion('Farm organization name', 'Synthetic farm')->expectsQuestion('Password (at least 12 characters)', 'test-password-123')->assertSuccessful();
        $this->assertDatabaseHas('organization_memberships', ['role' => 'farmer']);
        $this->assertFalse(User::where('email', 'farmer-access@example.test')->first()->is_platform_admin);
    }

    public function test_admin_dashboard_requires_platform_permission(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/api/v1/admin/dashboard')->assertForbidden();
        $user->is_platform_admin = true;
        $user->save();
        $this->actingAs($user)->getJson('/api/v1/admin/dashboard')->assertOk()->assertJsonPath('data.users', 1);
        $this->getJson('/api/v1/admin/organizations')->assertOk();
    }

    public function test_public_registration_cannot_grant_admin(): void
    {
        $this->postJson('/api/v1/register', ['name' => 'Trader', 'email' => 'trader@example.test', 'password' => 'secure-password-123', 'password_confirmation' => 'secure-password-123', 'is_platform_admin' => true])->assertCreated();
        $this->assertFalse(User::first()->is_platform_admin);
        $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
    }

    public function test_trader_role_is_scoped_to_membership_and_can_create_inventory(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/v1/organizations', ['name' => 'Trade company', 'type' => 'trader'])->assertCreated();
        $id = $response->json('data.id');
        $this->assertDatabaseHas('organization_memberships', ['organization_id' => $id, 'user_id' => $user->id, 'role' => 'trader']);
        $headers = ['X-Organization-ID' => (string) $id];
        $this->getJson('/api/v1/trader/dashboard', $headers)->assertOk()->assertJsonPath('data.inventory_lots', 0);
        $this->postJson('/api/v1/inventory-lots', ['product' => 'Pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '10000', 'minimum_order_kg' => '1000'], $headers)->assertCreated();
        $this->getJson('/api/v1/trader/dashboard', $headers)->assertOk()->assertJsonPath('data.inventory_lots', 1);
        $other = User::factory()->create();
        $this->actingAs($other)->getJson('/api/v1/trader/dashboard', $headers)->assertForbidden();
        $user->is_platform_admin = true;
        $user->save();
        $this->actingAs($user)->getJson('/api/v1/inventory-lots', ['X-Organization-ID' => '99999'])->assertForbidden();
    }

    public function test_invalid_organization_type_cannot_create_admin_membership(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/organizations', ['name' => 'Company', 'type' => 'admin'])->assertUnprocessable();
        $this->assertDatabaseCount('organization_memberships', 0);
    }

    public function test_cli_can_provision_admin_without_public_escalation(): void
    {
        $this->artisan('access:create admin@example.test --admin')->expectsQuestion('Name', 'Administrator')->expectsQuestion('Password (at least 12 characters)', 'test-password-123')->assertSuccessful();
        $this->assertTrue(User::where('email', 'admin@example.test')->first()->is_platform_admin);
    }

    public function test_cli_trader_creation_and_duplicate_protection(): void
    {
        $this->artisan('access:create trader@example.test --trader')->expectsQuestion('Name', 'Trader')->expectsQuestion('Trading organization name', 'Synthetic trader')->expectsQuestion('Password (at least 12 characters)', 'test-password-123')->assertSuccessful();
        $this->assertDatabaseHas('organization_memberships', ['role' => 'trader']);
        $this->artisan('access:create trader@example.test --admin')->assertFailed();
        $this->assertFalse(User::where('email', 'trader@example.test')->first()->is_platform_admin);
    }
}
