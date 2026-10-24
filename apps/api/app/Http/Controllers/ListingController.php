<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ListingController extends Controller
{
    private function decode(object $row): object
    {
        $row->details = json_decode($row->details);

        return $row;
    }

    private function owned(Request $r, int $id)
    {
        return DB::table('listings')->where('id', $id)->where('organization_id', WorkspaceController::organization($r));
    }

    public function index(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:draft,review,published,rejected,paused']);
        $p = DB::table('listings')->where('organization_id', WorkspaceController::organization($r))->when($r->q, fn ($q) => $q->where('title', 'like', '%'.$r->q.'%'))->when($r->status, fn ($q) => $q->where('status', $r->status))->orderByDesc('id')->paginate(12);
        $p->setCollection($p->getCollection()->map(fn ($l) => $this->decode($l)));

        return $p;
    }

    public function show(Request $r, int $listing)
    {
        $l = $this->owned($r, $listing)->first();
        abort_unless($l, 404);

        return ['data' => $this->decode($l)];
    }

    public function save(ListingRequest $r, ?int $listing = null)
    {
        $d = $r->validated();
        $d['details'] = array_intersect_key($d['details'], array_flip(['variety', 'description', 'quantity', 'minimum', 'unit', 'grade', 'harvest_date', 'country', 'province', 'city', 'warehouse', 'packaging', 'ready_days', 'price', 'currency']));
        $id = DB::transaction(function () use ($r, $listing, $d) {
            if ($listing) {
                $old = $this->owned($r, $listing)->lockForUpdate()->first();
                abort_unless($old, 404);
                abort_if($old->status === 'review', 409, 'Withdraw from review before editing.');
                if ($old->inventory_lot_id) {
                    $prior = json_decode($old->details, true);
                    foreach (['quantity', 'minimum', 'unit', 'country'] as $key) {
                        abort_if($prior[$key] !== $d['details'][$key], 409, 'Submitted stock quantities and origin cannot be edited. Create a new harvest lot.');
                    }
                }
            }
            $values = ['title' => $d['title'], 'product_category_id' => $d['product_category_id'] ?? null, 'details' => json_encode($d['details']), 'status' => 'draft', 'review_reason' => null, 'updated_at' => now()];
            if ($listing) {
                $this->owned($r, $listing)->update($values);
                $id = $listing;
            } else {
                $id = DB::table('listings')->insertGetId([...$values, 'organization_id' => WorkspaceController::organization($r), 'created_at' => now()]);
            }
            WorkspaceController::audit($r, 'listing.draft', 'listing:'.$id, [], WorkspaceController::organization($r));

            return $id;
        });

        return response()->json(['data' => $this->decode(DB::table('listings')->find($id))], $listing ? 200 : 201);
    }

    public function transition(Request $r, int $listing)
    {
        abort_unless(in_array($r->attributes->get('organization')->role, ['owner', 'manager', 'farmer']), 403);
        $d = $r->validate(['action' => 'required|in:submit,pause']);
        DB::transaction(function () use ($r, $listing, $d) {
            $row = $this->owned($r, $listing)->lockForUpdate()->first();
            abort_unless($row, 404);
            if ($d['action'] === 'submit') {
                abort_unless(in_array($row->status, ['draft', 'rejected', 'paused']), 409, 'Invalid listing transition.');
                $details = json_decode($row->details, true);
                Validator::make($details, [
                    'quantity' => 'required|string|regex:/^\d{1,12}(\.\d{1,3})?$/|gt:0',
                    'minimum' => 'required|string|regex:/^\d{1,12}(\.\d{1,3})?$/|gt:0|lte:quantity',
                    'grade' => 'required|string|max:80', 'country' => 'required|regex:/^[A-Z]{2}$/',
                ])->validate();
                if (! $row->inventory_lot_id) {
                    $factor = $details['unit'] === 'tonne' ? '1000' : '1';
                    $quantity = bcmul($details['quantity'], $factor, 3);
                    $minimum = bcmul($details['minimum'], $factor, 3);
                    abort_if(bccomp($quantity, '999999999999999.999', 3) > 0, 422, 'Quantity exceeds storage limit.');
                    $lot = DB::table('inventory_lots')->insertGetId(['organization_id' => $row->organization_id, 'product' => $row->title, 'origin_country' => $details['country'], 'on_hand_kg' => $quantity, 'minimum_order_kg' => $minimum, 'created_at' => now(), 'updated_at' => now()]);
                    DB::table('stock_movements')->insert(['inventory_lot_id' => $lot, 'type' => 'opening', 'quantity_kg' => $quantity, 'created_at' => now()]);
                    $this->owned($r, $listing)->update(['inventory_lot_id' => $lot]);
                }
                $status = 'review';
            } else {
                abort_unless(in_array($row->status, ['published', 'review']), 409, 'Invalid listing transition.');
                $status = 'paused';
            }
            $this->owned($r, $listing)->update(['status' => $status, 'updated_at' => now()]);
            WorkspaceController::audit($r, 'listing.'.$status, 'listing:'.$listing, [], $row->organization_id);
        });

        return $this->show($r, $listing);
    }

    private function market()
    {
        return DB::table('listings')->join('organizations', 'organizations.id', '=', 'listings.organization_id')->join('inventory_lots', 'inventory_lots.id', '=', 'listings.inventory_lot_id')->where('listings.status', 'published')->where('organizations.verification_status', 'verified')->where('organizations.suspended', false)->select('listings.*', 'organizations.name as supplier', 'inventory_lots.origin_country');
    }

    public function marketplace(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100', 'country' => 'nullable|regex:/^[A-Z]{2}$/', 'category' => 'nullable|integer']);
        $p = $this->market()->when($r->q, fn ($q) => $q->where('listings.title', 'like', '%'.$r->q.'%'))->when($r->country, fn ($q) => $q->where('inventory_lots.origin_country', $r->country))->when($r->category, fn ($q) => $q->where('product_category_id', $r->category))->orderByDesc('listings.id')->paginate(12);
        $p->setCollection($p->getCollection()->map(function ($l) {
            $l = $this->decode($l);
            $lot = WorkspaceController::lot(DB::table('inventory_lots')->find($l->inventory_lot_id));
            $l->available_kg = $lot->available_kg;
            $l->minimum_order_kg = (string) $lot->minimum_order_kg;
            unset($l->details->warehouse);

            return $l;
        }));

        return $p;
    }

    public function marketDetail(Request $r, int $listing)
    {
        $row = $this->market()->where('listings.id', $listing)->first();
        abort_unless($row, 404);
        $row = $this->decode($row);
        unset($row->details->warehouse);
        $row->lot = WorkspaceController::lot(DB::table('inventory_lots')->find($row->inventory_lot_id));

        return ['data' => $row];
    }
}
