#!/usr/bin/env bash
# MTAA Health - Generate project docs (README, API reference, changelog)
DOCS_DIR="docs"; mkdir -p "$DOCS_DIR"

cat > "$DOCS_DIR/API.md" << 'EOF'
# MTAA Health - API Reference
Base URL: `http://localhost:8081` (Expo web dev server)
Data layer: Supabase PostgREST (`<SUPABASE_URL>/rest/v1/*`) — see live schema in Supabase Dashboard.

## Core tables
| Table | Purpose |
|---|---|
| health_patients | Patient master (MRN auto-assigned) |
| health_staff | Clinical & admin staff |
| health_facilities | Hospitals / clinics / labs / pharmacies |
| health_appointments | Scheduling & status |
| health_prescriptions | Medication orders (JSONB meds) |
| health_lab_tests | Orders + results (JSONB) |

## PostgREST examples
    GET  {REST}/health_patients?select=*&limit=20
    POST {REST}/health_appointments            (auth required)
    PATCH {REST}/health_lab_tests?id=eq.<id>   (auth required)

## Auth
    Authorization: Bearer <supabase_jwt>
Errors follow PostgREST conventions (400/401/404/42501).
EOF

cat > "$DOCS_DIR/CHANGELOG.md" << 'EOF'
# Changelog
## [Unreleased]
- Initial MTAA Health ops toolkit (18 scripts)
- init-database.sql repaired: idempotent + mrn column fix
EOF

echo "✅ docs generated in $DOCS_DIR/"
