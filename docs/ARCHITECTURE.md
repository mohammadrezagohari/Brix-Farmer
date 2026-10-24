# Architecture

Monorepo: apps/api (Laravel), apps/web (Next.js), infra (containers), docs and scripts. Identity and organization authorization protect inventory application actions. PostgreSQL is authoritative; Redis supports queues and cache. HTTP uses /api/v1, session authentication and CSRF. Stock movement and outbox writes share reservation transactions. Future modules: Marketplace, Trading, CRM, Compliance, Documents, Operations.

Plan: (0) reconcile references; (1) executable infrastructure and identity; (2) inventory and marketplace; (3) trading and compliance; (4) CRM/collaboration; (5) operations; (6) security, PostgreSQL concurrency and end-to-end verification. Do not advance verified phase status without execution evidence.
