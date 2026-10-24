<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard()
    {
        $quantity = '0.000';
        foreach (DB::table('inventory_lots')->pluck('on_hand_kg') as $q) {
            $quantity = bcadd($quantity, (string) $q, 3);
        }

        return ['data' => ['users' => DB::table('users')->count(), 'organizations' => DB::table('organizations')->count(), 'pending_organizations' => DB::table('organizations')->where('verification_status', 'pending')->count(), 'verified_organizations' => DB::table('organizations')->where('verification_status', 'verified')->count(), 'farmers' => DB::table('organization_memberships')->whereIn('role', ['owner', 'farmer'])->distinct()->count('user_id'), 'traders' => DB::table('organization_memberships')->where('role', 'trader')->distinct()->count('user_id'), 'inventory_lots' => DB::table('inventory_lots')->count(), 'on_hand_kg' => $quantity, 'published' => DB::table('listings')->where('status', 'published')->count(), 'review' => DB::table('listings')->where('status', 'review')->count(), 'registrations' => DB::table('users')->selectRaw('DATE(created_at) as day, COUNT(*) as count')->groupByRaw('DATE(created_at)')->orderBy('day')->limit(30)->get(), 'distribution' => DB::table('listings')->select('status')->selectRaw('COUNT(*) as count')->groupBy('status')->get(), 'recent' => DB::table('audit_logs')->orderByDesc('id')->limit(8)->get()]];
    }

    public function users(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100']);

        return DB::table('users')->select('id', 'name', 'email', 'is_platform_admin', 'suspended', 'created_at')->when($r->q, fn ($q) => $q->where(fn ($x) => $x->where('name', 'like', '%'.$r->q.'%')->orWhere('email', 'like', '%'.$r->q.'%')))->orderByDesc('id')->paginate(12);
    }

    public function suspendUser(Request $r, int $user)
    {
        $d = $r->validate(['suspended' => 'required|boolean', 'reason' => 'required|string|min:5|max:2000']);
        DB::transaction(function () use ($r, $user, $d) {
            $target = DB::table('users')->where('id', $user)->lockForUpdate()->first();
            abort_unless($target, 404);
            abort_if($target->is_platform_admin, 422, 'Administrator accounts cannot be suspended here.');
            DB::table('users')->where('id', $user)->update(['suspended' => $d['suspended'], 'updated_at' => now()]);
            WorkspaceController::audit($r, 'user.suspension', 'user:'.$user, $d);
        });

        return response()->noContent();
    }

    public function organizations(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:pending,verified,rejected,corrections']);
        $p = DB::table('organizations')->when($r->q, fn ($q) => $q->where('name', 'like', '%'.$r->q.'%'))->when($r->status, fn ($q) => $q->where('verification_status', $r->status))->orderByDesc('id')->paginate(12);
        $p->setCollection($p->getCollection()->map(function ($o) {
            $o->profile = json_decode($o->profile ?? '{}');

            return $o;
        }));

        return $p;
    }

    public function reviewOrganization(Request $r, int $organization)
    {
        $d = $r->validate(['decision' => 'required|in:verified,rejected,corrections,suspend,activate', 'reason' => 'required|string|min:5|max:2000', 'evidence' => 'required|string|min:5|max:3000']);
        DB::transaction(function () use ($r, $organization, $d) {
            $org = DB::table('organizations')->where('id', $organization)->lockForUpdate()->first();
            abort_unless($org, 404);
            $profile = json_decode($org->profile ?? '{}', true);
            if ($d['decision'] === 'verified') {
                abort_unless(! empty($profile['legal_name']) && ! empty($profile['registration_number']) && ! empty($profile['address']) && ! empty($profile['country']), 422, 'Complete legal profile required.');
            }
            $values = in_array($d['decision'], ['suspend', 'activate']) ? ['suspended' => $d['decision'] === 'suspend'] : ['verification_status' => $d['decision']];
            DB::table('organizations')->where('id', $organization)->update([...$values, 'review_reason' => $d['reason'], 'updated_at' => now()]);
            WorkspaceController::audit($r, 'organization.'.$d['decision'], 'organization:'.$organization, $d, $organization);
        });

        return response()->noContent();
    }

    public function listings(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100', 'status' => 'nullable|in:draft,review,published,rejected,paused']);
        $p = DB::table('listings')->join('organizations', 'organizations.id', '=', 'listings.organization_id')->select('listings.*', 'organizations.name as supplier')->when($r->q, fn ($q) => $q->where('title', 'like', '%'.$r->q.'%'))->when($r->status, fn ($q) => $q->where('listings.status', $r->status))->orderByDesc('listings.id')->paginate(12);
        $p->setCollection($p->getCollection()->map(function ($l) {
            $l->details = json_decode($l->details);

            return $l;
        }));

        return $p;
    }

    public function reviewListing(Request $r, int $listing)
    {
        $d = $r->validate(['decision' => 'required|in:published,rejected', 'reason' => 'required|string|min:5|max:2000']);
        DB::transaction(function () use ($r, $listing, $d) {
            $l = DB::table('listings')->where('id', $listing)->lockForUpdate()->first();
            abort_unless($l, 404);
            abort_unless($l->status === 'review', 409, 'Only submitted listings can be reviewed.');
            $org = DB::table('organizations')->where('id', $l->organization_id)->lockForUpdate()->first();
            if ($d['decision'] === 'published') {
                abort_unless($org->verification_status === 'verified' && ! $org->suspended, 422, 'Verified supplier required.');
            }DB::table('listings')->where('id', $listing)->update(['status' => $d['decision'], 'review_reason' => $d['reason'], 'updated_at' => now()]);
            WorkspaceController::audit($r, 'listing.'.$d['decision'], 'listing:'.$listing, $d, $l->organization_id);
        });

        return response()->noContent();
    }

    public function categories()
    {
        return ['data' => DB::table('product_categories')->orderBy('name')->get()];
    }

    public function createCategory(Request $r)
    {
        $d = $r->validate(['name' => 'required|string|max:100|unique:product_categories']);
        $id = DB::transaction(function () use ($r, $d) {
            $id = DB::table('product_categories')->insertGetId([...$d, 'created_at' => now(), 'updated_at' => now()]);
            WorkspaceController::audit($r, 'category.created', 'category:'.$id, $d);

            return $id;
        });

        return response()->json(['data' => DB::table('product_categories')->find($id)], 201);
    }

    public function audits(Request $r)
    {
        $r->validate(['q' => 'nullable|string|max:100']);

        return DB::table('audit_logs')->when($r->q, fn ($q) => $q->where('action', 'like', '%'.$r->q.'%'))->orderByDesc('id')->paginate(20);
    }
}
