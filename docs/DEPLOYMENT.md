# Deployment

API image build troubleshooting: the PHP base explicitly uses `php:8.3-cli-bookworm`. APT uses the official Debian repositories over HTTPS, retries transient downloads and fails on any package-index update error. `libpq-dev` is a Debian development package for building `pdo_pgsql`; an `Unable to locate package` error requires inspecting the earlier APT update output, not installing PostgreSQL on the host. From the project root, capture a clean build with `docker compose --progress plain build --no-cache api 2>&1 | tee api-build.log`. Look for DNS resolution, connection/TLS/proxy or repository errors before the package installation step. Fix repository connectivity from the Docker build network as indicated by that log. Keep repository signatures and TLS verification enabled.

After transferring the updated `infra/api.Dockerfile` to the server, run `docker compose --progress plain build --no-cache api`, then `docker compose up -d --build`, and verify extensions with `docker compose exec api php -r 'foreach (["pdo_pgsql", "bcmath", "zip"] as $ext) { echo $ext, ": ", extension_loaded($ext) ? "ok" : "missing", PHP_EOL; }'`. This rebuild does not require deleting database volumes or stopping unrelated Compose projects. A successful local build does not verify a remote server's repository connectivity.

Public landing: `/`; authentication and registration: `/auth`. Set `NEXT_PUBLIC_SITE_URL` to the real public HTTPS origin before a production frontend build to populate canonical, sitemap and absolute social-image URLs. Root Compose forwards this setting from `.env`. Domain setup, indexing and production release are not part of the local landing change; see LANDING.md.

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
