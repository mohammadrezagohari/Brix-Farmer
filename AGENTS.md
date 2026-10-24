# Repository instructions

Read docs/DECISIONS.md and docs/IMPLEMENTATION_STATUS.md first. Missing source reference documents must not be described as reviewed. Keep quantities as decimal strings, use BCMath, and lock lots inside transactions. Verify organization membership for every private endpoint. Preserve inventory movements and outbox atomically. Never infer ownership from draft orders. Export confirmation must fail closed. Do not claim PostgreSQL concurrency based on SQLite tests. Update implementation status with executed commands and remaining gaps.
