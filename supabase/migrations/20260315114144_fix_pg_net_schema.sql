/*
  # Move pg_net extension out of public schema

  ## Summary
  Security hardening: relocates the `pg_net` extension from the public schema
  into the dedicated `extensions` schema to reduce the attack surface and
  follow Supabase security best practices.

  ## Changes
  - Drop `pg_net` from the `public` schema
  - Re-create `pg_net` in the `extensions` schema

  ## Notes
  - The `extensions` schema is the recommended home for all Postgres extensions
    in Supabase projects.
  - Any existing references to `net.*` functions will continue to work because
    Supabase's search_path includes the extensions schema by default.
*/

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
