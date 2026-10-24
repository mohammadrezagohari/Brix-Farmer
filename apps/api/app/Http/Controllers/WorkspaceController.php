<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkspaceController extends Controller
{
    public static function organization(Request $r): int
    {
        return $r->attributes->get('organization')->organization_id;
    }

    public static function manage(Request $r): void
    {
        abort_unless(in_array($r->attributes->get('organization')->role, ['owner', 'manager', 'farmer', 'trader']), 403);
    }

    public static function trader(Request $r): void
    {
        abort_unless(in_array($r->attributes->get('organization')->role, ['owner', 'manager', 'buyer', 'trader']), 403);
    }

    public static function audit(Request $r, string $action, string $subject, array $details = [], ?int $org = null): void
    {
        DB::table('audit_logs')->insert(['user_id' => $r->user()->id, 'organization_id' => $org, 'action' => $action, 'subject' => $subject, 'details' => json_encode($details), 'created_at' => now()]);
    }

    public static function lot(object $lot): object
    {
        $reserved = '0.000';
        foreach (DB::table('reservations')->where('inventory_lot_id', $lot->id)->where('status', 'active')->where('expires_at', '>', now())->pluck('quantity_kg') as $q) {
            $reserved = bcadd($reserved, (string) $q, 3);
        }
        $lot->on_hand_kg = bcadd((string) $lot->on_hand_kg, '0', 3);
        $lot->allocated_kg = bcadd((string) $lot->allocated_kg, '0', 3);
        $lot->reserved_kg = $reserved;
        $lot->available_kg = bcsub(bcsub($lot->on_hand_kg, $lot->allocated_kg, 3), $reserved, 3);

        return $lot;
    }

    public function dashboard(Request $r)
    {
        $org = self::organization($r);
        $lots = DB::table('inventory_lots')->where('organization_id', $org)->get()->map(fn ($l) => self::lot($l));
        $quantity = '0.000';
        foreach ($lots as $l) {
            $quantity = bcadd($quantity, $l->available_kg, 3);
        }

        return ['data' => ['inventory_lots' => $lots->count(), 'available_kg' => $quantity, 'published' => DB::table('listings')->where('organization_id', $org)->where('status', 'published')->count(), 'pending' => DB::table('listings')->where('organization_id', $org)->where('status', 'review')->count(), 'active_reservations' => DB::table('reservations')->where('organization_id', $org)->where('status', 'active')->where('expires_at', '>', now())->count(), 'incoming' => DB::table('reservations')->join('inventory_lots', 'inventory_lots.id', '=', 'reservations.inventory_lot_id')->where('inventory_lots.organization_id', $org)->where('reservations.status', 'active')->where('expires_at', '>', now())->count(), 'customers' => DB::table('trade_partners')->where('organization_id', $org)->count(), 'recent' => DB::table('audit_logs')->where('organization_id', $org)->orderByDesc('id')->limit(8)->get(), 'distribution' => DB::table('listings')->where('organization_id', $org)->select('status')->selectRaw('COUNT(*) as count')->groupBy('status')->get()]];
    }

    public function inventory(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100']);
        $page = DB::table('inventory_lots')->where('organization_id', self::organization($r))->when($r->q, fn ($q) => $q->where('product', 'like', '%'.$r->q.'%'))->orderByDesc('id')->paginate(12);
        $page->setCollection($page->getCollection()->map(fn ($l) => self::lot($l)));

        return $page;
    }

    public function movements(Request $r, int $lot)
    {
        abort_unless(DB::table('inventory_lots')->where('id', $lot)->where('organization_id', self::organization($r))->exists(), 404);

        return DB::table('stock_movements')->where('inventory_lot_id', $lot)->orderByDesc('id')->paginate(20);
    }

    public function incoming(Request $r)
    {
        return DB::table('reservations')->join('inventory_lots', 'inventory_lots.id', '=', 'reservations.inventory_lot_id')->join('organizations', 'organizations.id', '=', 'reservations.organization_id')->where('inventory_lots.organization_id', self::organization($r))->select('reservations.*', 'inventory_lots.product', 'organizations.name as buyer')->orderByDesc('reservations.id')->paginate(12);
    }

    public function profile(Request $r)
    {
        $org = DB::table('organizations')->find(self::organization($r));
        $org->profile = json_decode($org->profile ?? '{}');

        return ['data' => $org];
    }

    public function updateProfile(Request $r)
    {
        self::manage($r);
        $d = $r->validate(['legal_name' => 'required|string|max:200', 'registration_number' => 'required|string|max:100', 'country' => 'required|regex:/^[A-Z]{2}$/', 'address' => 'required|string|max:1000', 'phone' => 'nullable|string|max:50', 'farm' => 'nullable|string|max:500']);
        DB::transaction(function () use ($r, $d) {
            $id = self::organization($r);
            DB::table('organizations')->where('id', $id)->lockForUpdate()->first();
            DB::table('organizations')->where('id', $id)->update(['profile' => json_encode($d), 'verification_status' => 'pending', 'updated_at' => now()]);
            self::audit($r, 'profile.submitted', 'organization:'.$id, [], $id);
        });

        return $this->profile($r);
    }

    public function partners(Request $r)
    {
        self::trader($r);
        $r->validate(['q' => 'nullable|string|max:100']);

        return DB::table('trade_partners')->where('organization_id', self::organization($r))->when($r->q, fn ($q) => $q->where('company', 'like', '%'.$r->q.'%'))->orderByDesc('id')->paginate(12);
    }

    public function savePartner(Request $r)
    {
        self::trader($r);
        $d = $r->validate(['company' => 'required|string|max:160', 'country' => 'required|regex:/^[A-Z]{2}$/', 'contact' => 'nullable|string|max:100', 'email' => 'nullable|email|max:254', 'phone' => 'nullable|string|max:50', 'notes' => 'nullable|string|max:3000']);
        $id = DB::transaction(function () use ($r, $d) {
            $id = DB::table('trade_partners')->insertGetId([...$d, 'organization_id' => self::organization($r), 'created_at' => now(), 'updated_at' => now()]);
            self::audit($r, 'customer.created', 'partner:'.$id, [], self::organization($r));

            return $id;
        });

        return response()->json(['data' => DB::table('trade_partners')->find($id)], 201);
    }

    public function opportunities(Request $r)
    {
        self::trader($r);

        return DB::table('opportunities')->join('trade_partners', 'trade_partners.id', '=', 'opportunities.trade_partner_id')->where('opportunities.organization_id', self::organization($r))->select('opportunities.*', 'trade_partners.company')->orderByDesc('opportunities.id')->paginate(50);
    }

    public function saveOpportunity(Request $r)
    {
        self::trader($r);
        $d = $r->validate(['trade_partner_id' => 'required|integer', 'title' => 'required|string|max:160', 'next_action' => 'nullable|string|max:1000', 'due_at' => 'nullable|date']);
        abort_unless(DB::table('trade_partners')->where('id', $d['trade_partner_id'])->where('organization_id', self::organization($r))->exists(), 404);
        $id = DB::table('opportunities')->insertGetId([...$d, 'organization_id' => self::organization($r), 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['data' => DB::table('opportunities')->find($id)], 201);
    }

    public function stage(Request $r, int $opportunity)
    {
        self::trader($r);
        $d = $r->validate(['stage' => 'required|in:new,contacted,qualified,negotiation,proposal,won,lost']);
        DB::transaction(function () use ($r, $opportunity, $d) {
            $q = DB::table('opportunities')->where('id',$opportunity)->where('organization_id',self::organization($r));
            abort_unless($q->lockForUpdate()->first(),404);
            $q->update([...$d, 'updated_at' => now()]);
            self::audit($r,'opportunity.stage','opportunity:'.$opportunity,$d,self::organization($r));
        });

        return response()->noContent();
    }
}
