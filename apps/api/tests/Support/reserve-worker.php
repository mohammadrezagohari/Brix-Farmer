<?php

use App\Domain\Inventory\Reservations;
use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\HttpKernel\Exception\HttpException;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
[$script,$lot,$buyer,$key,$barrier] = $argv;
touch($barrier.'.'.$key.'.ready');
$deadline = microtime(true) + 15;
while (! file_exists($barrier.'.go')) {
    if (microtime(true) > $deadline) {
        exit(2);
    }usleep(20000);
}
try {
    app(Reservations::class)->reserve((int) $lot, (int) $buyer, '10000.000', $key);
    echo '201';
} catch (HttpException $e) {
    echo $e->getStatusCode();
}
