-- ponytail: pg_dump schema-only snapshots omit CREATE EXTENSION; mtaa_schema.sql
-- uses public.geography (PostGIS) and public.vector (pgvector) columns, so
-- both must exist before it runs.
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
