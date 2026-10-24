<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        abort_if(DB::table('users')->where('id', $request->user()->id)->where('suspended', true)->exists() && ! $request->is('api/v1/logout'), 403, 'Account suspended.');

        return $next($request);
    }
}
