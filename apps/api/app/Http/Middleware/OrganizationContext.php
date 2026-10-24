<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationContext
{
    public function handle(Request $request, Closure $next)
    {
        $membership = DB::table('organization_memberships')->join('organizations', 'organizations.id', '=', 'organization_memberships.organization_id')
            ->where('user_id', $request->user()->id)->where('organization_id', $request->header('X-Organization-ID'))->where('suspended', false)
            ->select('organization_memberships.*')->first();
        abort_unless($membership, 403, 'Active organization membership required.');
        $request->attributes->set('organization', $membership);

        return $next($request);
    }
}
