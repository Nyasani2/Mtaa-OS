# MTAA Health - Scripts Toolkit (18 files)

Safe to run: no script hard-exits your shell (that was what closed your terminal).

| # | File | Purpose |
|---|---|---|
| 1 | scripts/setup-environment.sh | .env + folders (warn-only checks) |
| 2 | scripts/init-database.sql | Idempotent schema + **mrn fix** |
| 3 | scripts/seed-database.ts | Idempotent seed (roles/facility/patient) |
| 4 | scripts/backup-database.sh | DB dump -> backups/ |
| 5 | scripts/health-check.sh | Env + app + Supabase connectivity |
| 6 | scripts/deploy.sh | Web build/start |
| 7 | scripts/cleanup.sh | Cache clean (never touches source/.env) |
| 8 | scripts/generate-types.sh | Supabase -> TS types |
| 9 | scripts/run-migrations.sh | Apply init-database.sql |
| 10 | scripts/create-migration.sh | New timestamped migration |
| 11 | scripts/export-data.sh | CSV export of health tables |
| 12 | scripts/import-data.sh | CSV import |
| 13 | scripts/monitor.sh | Uptime loop |
| 14 | scripts/notify.sh | Webhook notify |
| 15 | scripts/validate-config.sh | .env completeness |
| 16 | scripts/test-api.sh | Route smoke test |
| 17 | scripts/docker-build.sh | Docker image of web export |
| 18 | scripts/generate-docs.sh | README/API/changelog |
