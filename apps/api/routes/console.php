<?php

use App\Domain\Inventory\Reservations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('reservations')->where('status', 'active')->where('expires_at', '<=', now())->orderBy('id')->chunkById(100, function ($rows) {
        foreach ($rows as $row) {
            app(Reservations::class)->release($row->id);
        }
    });
})->name('expire-reservations')->everyMinute()->withoutOverlapping();

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
