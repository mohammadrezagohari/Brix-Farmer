# Deployment

For the affected server, host probes now show that Arvan's `/debian/dists/bookworm/InRelease`, `/debian/dists/bookworm-updates/InRelease` and `/debian-security/dists/bookworm-security/InRelease` return PGP-signed-message headers, while deb.debian.org times out. This confirms host retrieval only, not signature validity, mirror freshness, package availability or build-container connectivity. Transfer the updated Dockerfile/Compose file, then set `DEBIAN_MIRROR=https://mirror.arvancloud.ir` in root `.env` and run `docker compose --progress plain build api`, followed by `docker compose up -d --build`. The argument is a base URL without `/debian` or `/debian-security`; both original suite paths and Debian Signed-By settings are preserved. The default is still `https://deb.debian.org`. For a single build, `docker compose --progress plain build --build-arg DEBIAN_MIRROR=https://mirror.arvancloud.ir api` also works, but store the setting in `.env` before later `up --build` commands. Let APT verify signatures and release validity; do not bypass failures for an outdated or invalid mirror. This setting affects the API's Debian repositories only, not Composer or npm registries.

Confirmed remote build symptom (2026-10-24): APT reports TCP connection timeouts to resolved addresses for `deb.debian.org:443`. This is not evidence of a missing libpq-dev package, nor does successful name resolution establish that the returned addresses are correct. The web build was canceled after the API build failed; this does not establish an npm error.

On the affected Linux server, compare host and bridge access without changing the daemon or existing services:

```sh
getent ahostsv4 deb.debian.org
curl -4 -fI --connect-timeout 5 --max-time 15 https://deb.debian.org/debian/dists/bookworm/InRelease
docker run --rm php:8.3-cli-bookworm curl -4 -fI --connect-timeout 5 --max-time 15 https://deb.debian.org/debian/dists/bookworm/InRelease
```

If the host succeeds and bridge access fails, an isolated probe is `docker run --rm --network host php:8.3-cli-bookworm curl -4 -fI --connect-timeout 5 --max-time 15 https://deb.debian.org/debian/dists/bookworm/InRelease`. If that succeeds, the optional Linux build-only override can be used:

```sh
docker compose -f compose.yaml -f compose.build-host.yaml --progress plain build api web
docker compose up -d
```

The override changes `build.network` only; it does not put running services on the host network or alter their published ports. A separate BuildKit builder may require administrator-enabled `network.host` entitlement; if rejected, do not enable broad privileges blindly. If the host also fails, repair its outbound repository connectivity, resolver/proxy setup or select a reachable trusted Debian mirror; host build networking cannot fix a blocked host connection. No daemon restart, global DNS rewrite, fixed repository IP, volume deletion or TLS/signature bypass is part of this workaround. Keep builds and runtime changes scoped to this project.

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
