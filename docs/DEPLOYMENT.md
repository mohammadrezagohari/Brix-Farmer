# Deployment

Dashboard updates: after rebuilding API/web, run `docker compose exec api php artisan migrate --force`. Never run the test suite against the development database: use a separately created disposable PostgreSQL database and override DB_DATABASE in a one-off test container. The development servers and Docker Desktop engine were executable during the dashboard milestone; previous environment blockers below are historical.

New panel URLs: `/admin`, `/farmer`, `/trader`. Create accounts with `php artisan access:create <email> --admin`, `--farmer` or `--trader`. Existing supplier owner memberships retain access to farmer and trader workspaces. New modules do not change existing organization memberships or credentials.

Local development only. Copy root .env.example to .env and assign unique local database and MinIO credentials. Copy apps/api/.env.example to apps/api/.env. Generate APP_KEY with `cd apps/api; php artisan key:generate`. Set API APP_URL=http://localhost:8080 and SESSION_SECURE_COOKIE=false for local HTTP. Start Docker Desktop Linux engine, then from the root:

```
docker compose up --build -d
docker compose exec api php artisan migrate --force
docker compose exec api php artisan db:seed
```

Open http://localhost:8080. Mailpit: http://localhost:8025. MinIO console: http://localhost:9001. Storage and mail services exist but document storage and notification workflows are not yet integrated. Containers use development servers and are not a production deployment.

Queue: `docker compose exec api php artisan queue:work`. Scheduler: `docker compose exec api php artisan schedule:work`. These are manual development workers, not supervised services yet. Keep them running for queue and reservation expiry housekeeping.

Before staging: reconcile missing source documents, finish pending modules, run PostgreSQL concurrency/E2E tests, build frontend, configure PHP-FPM or hardened equivalent, HTTPS and trusted proxies, private storage, backups/restoration drills, least privilege database roles, queue supervision, scheduler, secret management, security headers, retention and monitoring. Do not deploy this incomplete foundation for real trade.
