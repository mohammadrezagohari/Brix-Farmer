<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class PostgresConcurrencyTest extends TestCase
{
    public function test_separate_postgres_processes_cannot_oversell(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requires PostgreSQL and independent processes.');
        }
        $ids = [];
        $lot = null;
        $barrier = sys_get_temp_dir().'/agritrade-lock-'.bin2hex(random_bytes(8));
        $processes = [];
        try {
            foreach (['seller', 'buyer-one', 'buyer-two'] as $name) {
                $ids[] = DB::table('organizations')->insertGetId(['name' => 'Synthetic concurrency '.$name, 'created_at' => now(), 'updated_at' => now()]);
            }
            $lot = DB::table('inventory_lots')->insertGetId(['organization_id' => $ids[0], 'product' => 'Synthetic concurrency pistachios', 'origin_country' => 'IR', 'on_hand_kg' => '10000.000', 'minimum_order_kg' => '1000.000', 'created_at' => now(), 'updated_at' => now()]);
            foreach (['one', 'two'] as $index => $key) {
                $processes[] = new Process([PHP_BINARY, base_path('tests/Support/reserve-worker.php'), (string) $lot, (string) $ids[$index + 1], $key, $barrier], base_path(), null, null, 25);
                $processes[$index]->start();
            }
            $deadline = microtime(true) + 15;
            while (! (file_exists($barrier.'.one.ready') && file_exists($barrier.'.two.ready'))) {
                if (microtime(true) > $deadline) {
                    $this->fail('Workers did not reach barrier.');
                }usleep(20000);
            }
            touch($barrier.'.go');
            $statuses = [];
            foreach ($processes as $process) {
                $process->wait();
                $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                $statuses[] = trim($process->getOutput());
            }
            sort($statuses);
            $this->assertSame(['201', '409'], $statuses);
            $this->assertSame(1, DB::table('reservations')->where('inventory_lot_id', $lot)->count());
            $this->assertSame(1, DB::table('stock_movements')->where('inventory_lot_id', $lot)->count());
        } finally {
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
            if ($lot) {
                $reservationIds = DB::table('reservations')->where('inventory_lot_id', $lot)->pluck('id');
                DB::table('outbox_events')->whereIn('payload->reservation_id', $reservationIds)->delete();
                DB::table('stock_movements')->where('inventory_lot_id', $lot)->delete();
                DB::table('reservations')->where('inventory_lot_id', $lot)->delete();
                DB::table('inventory_lots')->where('id', $lot)->delete();
            }
            DB::table('organizations')->whereIn('id', $ids)->delete();
            foreach (['.go', '.one.ready', '.two.ready'] as $suffix) {
                if (file_exists($barrier.$suffix)) {
                    unlink($barrier.$suffix);
                }
            }
        }
    }
}
