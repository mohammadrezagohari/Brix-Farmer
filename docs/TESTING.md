# Testing

Dashboard verification now includes DashboardWorkflowTest and PostgresConcurrencyTest. On SQLite the concurrency test explicitly skips. On a dedicated PostgreSQL test database it launches two PHP worker processes synchronized by a barrier and verifies one full-lot success/one conflict. **Never point RefreshDatabase at your development or production database.** Create an isolated database and set DB_DATABASE in a one-off container. Final PostgreSQL result: 21 tests, 106 assertions passed.

Browser suite: `cd apps/web`, set E2E_PASSWORD to an ephemeral random value, provision synthetic QA users via `php artisan db:seed --class=DashboardQaSeeder` from apps/api with the same environment value (local/testing only). Start Laravel on 8000 and built Next.js on 3100, then `npx playwright test`. Default browser is installed Chrome; adjust Playwright channel for another supported installation. Seed only in a disposable/local QA database; existing QA accounts are not overwritten. Suite reuses authenticated session cookies within a worker to respect login throttling. Raw traces can contain test inputs; keep them private and ignored.

Final browser result: 6 passed, including responsive role shells at 375/768/1024/1440 and the farmer→admin→trader 50t/10t reservation journey. Screenshots saved to ignored test-results. These browser tests exercised the SQLite local adapter; PostgreSQL execution is separately covered by backend tests. Export/order journeys remain pending.

From apps/api: `php artisan test` (SQLite functional tests), `vendor/bin/pint --test`. From apps/web: `npm ci`, `npm run build`, `npm run typecheck`.

InventoryTest covers partial reservation, repeat retries, sequential oversell conflict, expiry, repeat release, cross-organization rejection, lot validation and registration/membership. InventoryTest alone does not prove concurrency. PostgresConcurrencyTest separately synchronizes two processes before reserving a 10,000 kg lot, each requesting 10,000 kg; it asserts one success and one 409 and one matching reservation/movement. Always use a disposable PostgreSQL test database, never production.

Browser dashboard/reservation E2E and PostgreSQL concurrency are now executed as above. Larastan, the full security suite and remaining order/export acceptance cases are pending. Consult IMPLEMENTATION_STATUS.md for actual executed results.
