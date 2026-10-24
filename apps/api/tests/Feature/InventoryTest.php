<?php

namespace Tests\Feature;

use App\Domain\Inventory\Reservations;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private function organization(string $name): int
    {
        return DB::table('organizations')->insertGetId(['name' => $name, 'verification_status' => 'verified', 'created_at' => now(), 'updated_at' => now()]);
    }

    private function lot(int $seller): int
    {
        return DB::table('inventory_lots')->insertGetId(['organization_id' => $seller, 'product' => 'Synthetic pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '50000.000', 'minimum_order_kg' => '1000.000', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function test_partial_reservation_retry_conflict_and_release(): void
    {
        $lot = $this->lot($this->organization('Seller'));
        $buyer = $this->organization('Buyer');
        $a = app(Reservations::class);
        $r = $a->reserve($lot, $buyer, '10000.000', 'test-key');
        $this->assertSame($r->id, $a->reserve($lot, $buyer, '10000', 'test-key')->id);
        $this->assertDatabaseCount('reservations', 1);
        $this->assertDatabaseCount('outbox_events', 1);
        $a->release($r->id, $buyer);
        $a->release($r->id, $buyer);
        $this->assertDatabaseCount('stock_movements', 2);
        $this->assertSame('released', DB::table('reservations')->find($r->id)->status);
    }

    public function test_overselling_is_rejected(): void
    {
        $lot = $this->lot($this->organization('Seller'));
        $a = app(Reservations::class);
        $a->reserve($lot, $this->organization('Buyer'), '50000', 'one');
        $this->expectException(HttpException::class);
        $a->reserve($lot, $this->organization('Other buyer'), '1000', 'two');
    }

    public function test_expired_reservation_does_not_consume_availability(): void
    {
        $lot = $this->lot($this->organization('Seller'));
        $buyer = $this->organization('Buyer');
        $a = app(Reservations::class);
        $a->reserve($lot, $buyer, '50000', 'one');
        $this->travel(31)->minutes();
        $this->assertNotNull($a->reserve($lot, $buyer, '50000', 'two'));
    }

    public function test_cross_organization_access_is_forbidden(): void
    {
        $u = User::factory()->create();
        $org = $this->organization('Unrelated');
        $this->actingAs($u)->getJson('/api/v1/inventory-lots', ['X-Organization-ID' => $org])->assertForbidden();
    }

    public function test_members_can_create_lots_but_invalid_quantities_fail(): void
    {
        $u = User::factory()->create();
        $org = $this->organization('Owner');
        DB::table('organization_memberships')->insert(['organization_id' => $org, 'user_id' => $u->id, 'role' => 'owner']);
        $this->actingAs($u)->postJson('/api/v1/inventory-lots', ['product' => 'Pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '50000', 'minimum_order_kg' => '1000'], ['X-Organization-ID' => $org])->assertCreated();
        $this->postJson('/api/v1/inventory-lots', ['product' => 'Pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '-1', 'minimum_order_kg' => '1000'], ['X-Organization-ID' => $org])->assertUnprocessable();
        $this->assertDatabaseCount('inventory_lots', 1);
    }

    public function test_registration_and_organization_creation(): void
    {
        $this->postJson('/api/v1/register', ['name' => 'Demo', 'email' => 'demo@example.test', 'password' => 'test-password-123', 'password_confirmation' => 'test-password-123'])->assertCreated();
        $this->postJson('/api/v1/organizations', ['name' => 'Synthetic cooperative'])->assertCreated();
        $this->assertDatabaseHas('organization_memberships', ['role' => 'owner']);
        $this->postJson('/api/v1/logout')->assertNoContent();
    }
}
