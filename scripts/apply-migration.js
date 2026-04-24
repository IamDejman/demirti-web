#!/usr/bin/env node
/**
 * Apply a .sql migration file against DATABASE_URL (or POSTGRES_URL).
 * Usage: node scripts/apply-migration.js scripts/enable-rls.sql
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    const c = val.indexOf('#');
    if (c !== -1) val = val.slice(0, c).trim();
    val = val.replace(/^["']|["']$/g, '');
    if (['DATABASE_URL', 'POSTGRES_URL', 'NEW_POSTGRES_URL'].includes(key)) {
      process.env[key] = val;
    }
  }
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL || process.env.NEW_POSTGRES_URL || '';
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.');
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/apply-migration.js <sql-file>');
  process.exit(1);
}
const sqlText = fs.readFileSync(path.resolve(file), 'utf8');

(async () => {
  const pg = require('pg');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sqlText);
    await client.query('COMMIT');
    console.log(`Applied: ${file}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
