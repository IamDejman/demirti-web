-- Drop analytics/tracking tables (no longer used after removing page tracking).
-- Run with: psql "$POSTGRES_URL" -f scripts/drop-analytics-tables.sql
-- Or paste into your SQL client (Vercel Postgres, TablePlus, etc.)

DROP TABLE IF EXISTS goal_completions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS funnels CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS consent_log CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP TABLE IF EXISTS events CASCADE;
