<?php

namespace App\Domain\Inventory;

use Illuminate\Support\Facades\DB;

final class Reservations
{
    public function reserve(int $lotId, int $buyer, string $quantity, string $key, bool $requirePublished = false): object
    {
        return DB::transaction(function () use ($lotId, $buyer, $quantity, $key, $requirePublished) {
            // Serialize all reservation lifecycle operations for a lot.
            $lot = DB::table('inventory_lots')->where('id', $lotId)->lockForUpdate()->first();
            abort_unless($lot, 404);
            if ($requirePublished) {
                $listing = DB::table('listings')->where('inventory_lot_id', $lotId)->where('status', 'published')->lockForUpdate()->first();
                abort_unless($listing, 404, 'Published listing required.');
                $seller = DB::table('organizations')->where('id', $lot->organization_id)->lockForUpdate()->first();
                abort_unless($seller && $seller->verification_status === 'verified' && ! $seller->suspended, 409, 'Supplier is not eligible.');
            }
            // Serialize idempotency keys across different lots for this buyer too.
            DB::table('organizations')->where('id', $buyer)->lockForUpdate()->first();
            $existing = DB::table('reservations')->where('organization_id', $buyer)->where('idempotency_key', $key)->first();
            if ($existing) {
                abort_if($existing->inventory_lot_id != $lotId || bccomp($existing->quantity_kg, $quantity, 3) !== 0, 409, 'Idempotency key reused with different input.');

                return $existing;
            }
            abort_if($lot->organization_id === $buyer, 422, 'Cannot reserve your own lot.');
            abort_if(bccomp($quantity, $lot->minimum_order_kg, 3) < 0, 422, 'Below minimum order quantity.');
            $reserved = '0.000';
            foreach (DB::table('reservations')->where('inventory_lot_id', $lotId)->where('status', 'active')->where('expires_at', '>', now())->get() as $row) {
                $reserved = bcadd($reserved, $row->quantity_kg, 3);
            }
            $available = bcsub(bcsub($lot->on_hand_kg, $lot->allocated_kg, 3), $reserved, 3);
            abort_if(bccomp($quantity, $available, 3) > 0, 409, 'Insufficient available inventory.');
            $id = DB::table('reservations')->insertGetId(['inventory_lot_id' => $lotId, 'organization_id' => $buyer, 'quantity_kg' => $quantity, 'idempotency_key' => $key, 'status' => 'active', 'expires_at' => now()->addMinutes(30), 'created_at' => now(), 'updated_at' => now()]);
            $this->record($lotId, $id, 'reserved', $quantity);

            return DB::table('reservations')->find($id);
        }, 3);
    }

    public function release(int $id, ?int $buyer = null): void
    {
        DB::transaction(function () use ($id, $buyer) {
            $reservation = DB::table('reservations')->find($id);
            abort_unless($reservation, 404);
            abort_if($buyer !== null && $reservation->organization_id !== $buyer, 404);
            DB::table('inventory_lots')->where('id', $reservation->inventory_lot_id)->lockForUpdate()->first();
            $reservation = DB::table('reservations')->find($id);
            if ($reservation->status !== 'active') {
                return;
            }
            DB::table('reservations')->where('id', $id)->update(['status' => 'released', 'updated_at' => now()]);
            $this->record($reservation->inventory_lot_id, $id, 'released', $reservation->quantity_kg);
        }, 3);
    }

    private function record(int $lot, int $reservation, string $type, string $quantity): void
    {
        DB::table('stock_movements')->insert(['inventory_lot_id' => $lot, 'reservation_id' => $reservation, 'type' => $type, 'quantity_kg' => $quantity, 'created_at' => now()]);
        DB::table('outbox_events')->insert(['type' => 'inventory.'.$type, 'payload' => json_encode(['reservation_id' => $reservation, 'lot_id' => $lot]), 'created_at' => now()]);
    }
}
