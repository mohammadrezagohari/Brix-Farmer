<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role): array
    {
        $user = User::factory()->create();
        $id = DB::table('organizations')->insertGetId(['name' => 'Synthetic '.$role, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('organization_memberships')->insert(['organization_id' => $id, 'user_id' => $user->id, 'role' => $role]);

        return [$user, $id, ['X-Organization-ID' => (string) $id]];
    }

    private function product(): array
    {
        return ['title' => 'Kerman pistachios', 'details' => ['quantity' => '50', 'minimum' => '1', 'unit' => 'tonne', 'grade' => 'A', 'country' => 'IR', 'currency' => 'USD', 'description' => 'Synthetic harvest']];
    }

    public function test_farmer_review_marketplace_and_partial_reservation_journey(): void
    {
        [$farmer,$seller,$headers] = $this->account('owner');
        [$trader,$buyer,$buyerHeaders] = $this->account('trader');
        $admin = User::factory()->create();
        $admin->is_platform_admin = true;
        $admin->save();
        $this->actingAs($farmer)->putJson('/api/v1/organization-profile', ['legal_name' => 'Synthetic farmer', 'registration_number' => 'SYN-1', 'country' => 'IR', 'address' => 'Synthetic Kerman address'], $headers)->assertOk();
        $response = $this->postJson('/api/v1/listings', $this->product(), $headers)->assertCreated();
        $id = $response->json('data.id');
        $this->postJson("/api/v1/listings/$id/transition", ['action' => 'submit'], $headers)->assertOk()->assertJsonPath('data.status', 'review');
        $this->assertDatabaseHas('inventory_lots', ['on_hand_kg' => '50000.000']);
        $this->actingAs($trader)->getJson('/api/v1/marketplace', $buyerHeaders)->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/api/v1/admin/listings/$id/review", ['decision' => 'published', 'reason' => 'Synthetic test review'])->assertForbidden();
        $this->actingAs($admin)->postJson("/api/v1/admin/listings/$id/review", ['decision' => 'published', 'reason' => 'Synthetic test review'])->assertUnprocessable();
        $this->postJson("/api/v1/admin/organizations/$seller/review", ['decision' => 'verified', 'reason' => 'Synthetic test review', 'evidence' => 'Synthetic test-only identity evidence'])->assertNoContent();
        $this->postJson("/api/v1/admin/listings/$id/review", ['decision' => 'published', 'reason' => 'Synthetic test publication'])->assertNoContent();
        $listing = DB::table('listings')->find($id);
        $lot = $listing->inventory_lot_id;
        $this->actingAs($trader)->getJson('/api/v1/marketplace', $buyerHeaders)->assertJsonCount(1, 'data')->assertJsonPath('data.0.available_kg', '50000.000');
        $this->postJson("/api/v1/inventory-lots/$lot/reservations", ['quantity_kg' => '10000'], [...$buyerHeaders, 'Idempotency-Key' => 'journey-1'])->assertCreated();
        $this->getJson("/api/v1/marketplace/$id", $buyerHeaders)->assertOk()->assertJsonPath('data.lot.available_kg', '40000.000');
        $this->actingAs($farmer)->getJson('/api/v1/incoming-reservations', $headers)->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/workspace/dashboard', $headers)->assertJsonPath('data.available_kg', '40000.000');
        $this->assertDatabaseCount('outbox_events', 1);
        $this->assertGreaterThanOrEqual(5, DB::table('audit_logs')->count());
    }

    public function test_partial_draft_does_not_create_stock_and_cannot_be_submitted(): void
    {
        [$user,,$h] = $this->account('owner');
        $id = $this->actingAs($user)->postJson('/api/v1/listings', ['title' => 'Draft', 'details' => ['unit' => 'kg', 'currency' => 'USD']], $h)->assertCreated()->json('data.id');
        $this->assertDatabaseCount('inventory_lots', 0);
        $this->postJson("/api/v1/listings/$id/transition", ['action' => 'submit'], $h)->assertUnprocessable();
    }

    public function test_tenant_isolation_and_immutable_submitted_quantities(): void
    {
        [$farmer,,$h] = $this->account('owner');
        [$other,,$h2] = $this->account('owner');
        $id = $this->actingAs($farmer)->postJson('/api/v1/listings', $this->product(), $h)->json('data.id');
        $this->actingAs($other)->getJson("/api/v1/listings/$id", $h2)->assertNotFound();
        $this->putJson("/api/v1/listings/$id", $this->product(), $h2)->assertNotFound();
        $this->actingAs($farmer)->postJson("/api/v1/listings/$id/transition", ['action' => 'submit'], $h)->assertOk();
        $this->postJson("/api/v1/listings/$id/transition", ['action' => 'submit'], $h)->assertConflict();
        $this->assertDatabaseCount('inventory_lots', 1);
        $this->postJson("/api/v1/listings/$id/transition", ['action' => 'pause'], $h)->assertOk();
        $changed = $this->product();
        $changed['details']['quantity'] = '100';
        $this->putJson("/api/v1/listings/$id", $changed, $h)->assertConflict();
        $this->assertDatabaseHas('inventory_lots', ['on_hand_kg' => '50000.000']);
    }

    public function test_private_crm_and_opportunity_access(): void
    {
        [$trader,,$h] = $this->account('trader');
        [$other,,$h2] = $this->account('trader');
        $id = $this->actingAs($trader)->postJson('/api/v1/trade-partners', ['company' => 'Synthetic India Import', 'country' => 'IN'], $h)->assertCreated()->json('data.id');
        $opportunity = $this->postJson('/api/v1/opportunities', ['trade_partner_id' => $id, 'title' => 'Pistachio lead'], $h)->assertCreated()->json('data.id');
        $this->actingAs($other)->getJson('/api/v1/trade-partners', $h2)->assertJsonCount(0, 'data');
        $this->postJson('/api/v1/opportunities', ['trade_partner_id' => $id, 'title' => 'Unauthorized'], $h2)->assertNotFound();
        $this->patchJson("/api/v1/opportunities/$opportunity/stage", ['stage' => 'won'], $h2)->assertNotFound();
        $this->actingAs($trader)->patchJson("/api/v1/opportunities/$opportunity/stage", ['stage' => 'negotiation'], $h)->assertNoContent();
    }

    public function test_suspension_enforcement_and_required_review_evidence(): void
    {
        [$user,$org,$h] = $this->account('owner');
        $admin = User::factory()->create();
        $admin->is_platform_admin = true;
        $admin->save();
        $this->actingAs($admin)->postJson("/api/v1/admin/organizations/$org/review", ['decision' => 'verified', 'reason' => 'test reason'])->assertUnprocessable();
        $this->postJson("/api/v1/admin/users/{$user->id}/suspension", ['suspended' => true, 'reason' => 'Synthetic safety review'])->assertNoContent();
        $this->actingAs($user)->getJson('/api/v1/me')->assertForbidden();
        $this->getJson('/api/v1/workspace/dashboard',$h)->assertForbidden();
    }
}
