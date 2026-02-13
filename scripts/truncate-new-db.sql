-- Run on NEW DB only. Truncates each table that exists (skips missing ones).
-- Usage: psql "$NEW_POSTGRES_URL" -f scripts/truncate-new-db.sql

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  )
  LOOP
    BEGIN
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.nspname) || '.' || quote_ident(r.relname) || ' RESTART IDENTITY CASCADE';
    EXCEPTION
      WHEN undefined_table THEN
        NULL;  -- skip if table missing
    END;
  END LOOP;
END $$;
