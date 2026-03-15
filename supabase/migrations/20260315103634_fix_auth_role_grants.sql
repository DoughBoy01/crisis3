/*
  # Fix Auth Role Grants

  Grants the necessary privileges to the Supabase auth roles so that
  the Auth service can query the schema and perform login operations.

  This fixes the "Database error querying schema" error during sign-in.
*/

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin, authenticator;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO anon, authenticated;

GRANT USAGE ON SCHEMA auth TO postgres, supabase_auth_admin, authenticator;
