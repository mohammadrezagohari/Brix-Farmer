<?php

use App\Http\Controllers\AdminController as Admin;
use App\Http\Controllers\ListingController as Listings;
use App\Http\Controllers\WorkspaceController as Workspace;
use App\Http\Middleware\ActiveUser;
use App\Http\Middleware\OrganizationContext;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1')->middleware(['auth:sanctum', ActiveUser::class, 'throttle:120,1'])->group(function () {
    Route::get('categories', [Admin::class, 'categories']);
    Route::prefix('admin')->middleware('can:platform-admin')->group(function () {
        Route::get('users', [Admin::class, 'users']);
        Route::post('users/{user}/suspension', [Admin::class, 'suspendUser']);
        Route::post('organizations/{organization}/review', [Admin::class, 'reviewOrganization']);
        Route::get('listings', [Admin::class, 'listings']);
        Route::post('listings/{listing}/review', [Admin::class, 'reviewListing']);
        Route::get('categories', [Admin::class, 'categories']);
        Route::post('categories', [Admin::class, 'createCategory']);
        Route::get('audit-logs', [Admin::class, 'audits']);
    });
    Route::middleware(OrganizationContext::class)->group(function () {
        Route::get('workspace/dashboard', [Workspace::class, 'dashboard']);
        Route::get('workspace/inventory', [Workspace::class, 'inventory']);
        Route::get('inventory-lots/{lot}/movements', [Workspace::class, 'movements']);
        Route::get('incoming-reservations', [Workspace::class, 'incoming']);
        Route::get('organization-profile', [Workspace::class, 'profile']);
        Route::put('organization-profile', [Workspace::class, 'updateProfile']);
        Route::get('listings', [Listings::class, 'index']);
        Route::post('listings', [Listings::class, 'save']);
        Route::get('listings/{listing}', [Listings::class, 'show']);
        Route::put('listings/{listing}', [Listings::class, 'save']);
        Route::post('listings/{listing}/transition', [Listings::class, 'transition']);
        Route::get('marketplace', [Listings::class, 'marketplace']);
        Route::get('marketplace/{listing}', [Listings::class, 'marketDetail']);
        Route::get('trade-partners', [Workspace::class, 'partners']);
        Route::post('trade-partners', [Workspace::class, 'savePartner']);
        Route::get('opportunities', [Workspace::class, 'opportunities']);
        Route::post('opportunities', [Workspace::class, 'saveOpportunity']);
        Route::patch('opportunities/{opportunity}/stage',[Workspace::class, 'stage']);
    });
});
