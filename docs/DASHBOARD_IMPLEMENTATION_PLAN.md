# Dashboard implementation plan

## Inspection

Existing Next.js has one client page, dictionaries for ten locales, system/manual theme; no dedicated panel routes, shared shell or real catalogue. Laravel provides session auth, platform-admin Gate, membership middleware, two read-only admin endpoints, lots/reservations, stock movements and outbox. Existing tests cover authentication, role injection and inventory. src/main.py is empty and unrelated; preserve it.

Read existing architecture, database, API, security, testing, deployment and status documents. Original PRD DOCX/PDF, workflow DOCX/PDF, Mermaid ERD/workflows, original OpenAPI and README_FA remain absent. Existing docs/openapi.json describes the current foundation, not those unavailable references.

## Incremental implementation contract

1. Shared responsive shell for /admin, /farmer and /trader; sidebar, mobile drawer, role-aware navigation, breadcrumbs, search, profile, organization switcher; preserve ten languages/theme. Add Vazirmatn locally and reusable badges, cards, tables, confirmation and pagination. No decorative links to unfinished workflows.
2. Database-backed role dashboards: registrations, product distribution, stock and reservations, review queue, recent audit activity. Missing order/trade metrics must remain explicitly unavailable rather than fabricated.
3. First operational vertical slice: farmer product wizard with persisted drafts and lot creation, review submission, admin KYB/listing decisions with reasons/audit, approved public marketplace, product detail and partial reservation, incoming supplier requests, trader inventory/reservations, organization profile. Add private CRM customers and opportunities if verified slice is complete.
4. Add server controllers, validation, tenant/role authorization, search/filter/pagination. Preserve opening stock and reservation invariants. Product editing must not mutate committed stock fields. Review edits invalidate prior moderation. No unverified publication.
5. Test access denial, review-to-marketplace, quantities, drafts and tenant isolation. Run build, PHP tests, PostgreSQL migrations/integration if Docker permissions permit. Verify UI at 375/768/1024/1440 if browser infrastructure exists. Document unexecuted checks.

## Page/API map

| Panel | Pages | API |
|---|---|---|
| Admin | overview, users, organizations/KYB, listings, categories, audit | /admin/dashboard, /admin/users, /admin/organizations, /admin/listings, /admin/categories, /admin/audit-logs |
| Farmer | overview, products, new product wizard, inventory, incoming reservations, profile | /workspace/dashboard, /listings, /inventory-lots, /incoming-reservations, /organization-profile |
| Trader | overview, marketplace/detail, reservations, inventory, CRM customers/opportunities, profile | /workspace/dashboard, /marketplace, /reservations, /trade-partners, /opportunities |

## Implemented milestone

Dedicated panel routes and responsive shell delivered, plus shared cards, badges, modal/drawer, tables, pagination, skeletons, empty/error/toast states, charts from persisted counts and local Vazirmatn. Farmer drafts and five-step wizard, submission/withdrawal, stock ledger, incoming temporary holds and legal profile. Admin user suspension, organization decisions with reason/evidence, listing moderation, categories and audit browser. Trader approved marketplace/detail/reservations and private customers/pipeline. Every visible action in these menus calls a backend endpoint; future modules are grouped on an explicit informational page.

PostgreSQL integration and an independent-process reservation race test have executed successfully. Full orders/contracts/export scenarios still cannot be accepted because their domain workflows are not implemented in this milestone.

## Not yet complete

Negotiated RFQ versions, contracts/order state machines, evidence-based acquisition/resale, export compliance and approval, shipment/payment/disputes, secure document vault, messaging/invitations, full admin system settings and CSV remain pending. Show an explicit future-capabilities area rather than functioning-looking dead menu entries. Reservations must be labelled temporary holds, not orders or ownership. Original full request is not complete until these workflows and acceptance scenarios are implemented and verified.
