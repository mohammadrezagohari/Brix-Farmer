<?php

use App\Domain\Inventory\Reservations;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\ActiveUser;
use App\Http\Middleware\OrganizationContext;
use App\Http\Requests\CreateLotRequest;
use App\Http\Requests\ReserveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password;

Route::prefix('api/v1')->group(function () {
    Route::get('health', fn () => ['status' => 'ok']);
    Route::get('csrf', fn () => ['token' => csrf_token()]);
    Route::post('register', function (Request $r) {
        $d = $r->validate(['name' => 'required|string|max:100', 'email' => 'required|email|max:254|unique:users', 'password' => ['required', 'confirmed', Password::min(12)]]);
        $u = User::create(['name' => $d['name'], 'email' => $d['email'], 'password' => Hash::make($d['password'])]);
        Auth::login($u);
        $r->session()->regenerate();

        return response()->json(['data' => $u], 201);
    })->middleware('throttle:5,1');
    Route::post('login', function (Request $r) {
        $d = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        abort_unless(Auth::attempt($d), 422, 'Invalid credentials.');
        $r->session()->regenerate();

        return ['data' => $r->user()];
    })->middleware('throttle:5,1');
    Route::middleware(['auth:sanctum', ActiveUser::class])->group(function () {
        Route::get('admin/dashboard', [AdminController::class, 'dashboard'])->middleware('can:platform-admin');
        Route::get('admin/organizations', [AdminController::class, 'organizations'])->middleware('can:platform-admin');
        Route::get('me', fn (Request $r) => ['data' => $r->user()]);
        Route::post('logout', function (Request $r) {
            Auth::guard('web')->logout();
            $r->session()->invalidate();
            $r->session()->regenerateToken();

            return response()->noContent();
        });
        Route::get('organizations', fn (Request $r) => ['data' => DB::table('organizations')->join('organization_memberships', 'organizations.id', '=', 'organization_memberships.organization_id')->where('user_id', $r->user()->id)->select('organizations.*', 'organization_memberships.role')->get()]);
        Route::post('organizations', function (Request $r) {
            $d = $r->validate(['name' => 'required|string|max:160', 'type' => 'sometimes|in:supplier,trader']);
            $id = DB::transaction(function () use ($r, $d) {
                $id = DB::table('organizations')->insertGetId(['name' => $d['name'], 'created_at' => now(), 'updated_at' => now()]);
                DB::table('organization_memberships')->insert(['organization_id' => $id, 'user_id' => $r->user()->id, 'role' => ($d['type'] ?? 'supplier') === 'trader' ? 'trader' : 'owner', 'created_at' => now(), 'updated_at' => now()]);

                return $id;
            });

            return response()->json(['data' => DB::table('organizations')->find($id)], 201);
        });
        Route::middleware(OrganizationContext::class)->group(function () {
            Route::get('trader/dashboard', function (Request $r) {
                $context = $r->attributes->get('organization');
                abort_unless(in_array($context->role, ['trader', 'owner', 'manager', 'buyer']), 403);

                return ['data' => ['inventory_lots' => DB::table('inventory_lots')->where('organization_id', $context->organization_id)->count(), 'active_reservations' => DB::table('reservations')->where('organization_id', $context->organization_id)->where('status', 'active')->where('expires_at', '>', now())->count()]];
            });
            Route::get('inventory-lots', fn (Request $r) => DB::table('inventory_lots')->where('organization_id', $r->attributes->get('organization')->organization_id)->orderByDesc('id')->paginate(20));
            Route::post('inventory-lots', function (CreateLotRequest $r) {
                $id = DB::transaction(function () use ($r) {
                    $d = $r->validated();
                    $id = DB::table('inventory_lots')->insertGetId([...$d, 'organization_id' => $r->attributes->get('organization')->organization_id, 'created_at' => now(), 'updated_at' => now()]);
                    DB::table('stock_movements')->insert(['inventory_lot_id' => $id, 'type' => 'opening', 'quantity_kg' => $d['on_hand_kg'], 'created_at' => now()]);

                    return $id;
                });

                return response()->json(['data' => DB::table('inventory_lots')->find($id)], 201);
            });
            Route::post('inventory-lots/{lot}/reservations', function (ReserveRequest $r, int $lot, Reservations $a) {
                abort_unless(DB::table('inventory_lots')->join('organizations', 'organizations.id', '=', 'inventory_lots.organization_id')->where('inventory_lots.id', $lot)->where('verification_status', 'verified')->where('suspended', false)->exists(), 404);
                abort_unless(DB::table('listings')->where('inventory_lot_id', $lot)->where('status', 'published')->exists(), 404, 'Published listing required.');

                return response()->json(['data' => $a->reserve($lot, $r->attributes->get('organization')->organization_id, $r->validated('quantity_kg'), $r->validated('idempotency_key'), true)], 201);
            });
            Route::get('reservations', fn (Request $r) => DB::table('reservations')->where('organization_id', $r->attributes->get('organization')->organization_id)->orderByDesc('id')->paginate(20));
            Route::post('reservations/{reservation}/release', function (Request $r, int $reservation, Reservations $a) {
                abort_unless(in_array($r->attributes->get('organization')->role, ['owner', 'manager', 'buyer', 'trader']), 403);
                $a->release($reservation, $r->attributes->get('organization')->organization_id);

                return response()->noContent();
            });
        });
    });
});
