#!/usr/bin/env node
/**
 * Calls /api/init-db with CRON_SECRET.
 *
 * Dev (uses .env.local):
 *   npm run init-db
 *
 * Prod (pass CRON_SECRET and INIT_DB_URL):
 *   CRON_SECRET=xxx INIT_DB_URL=https://your-domain.com/api/init-db npm run init-db
 *
 * Debug: INIT_DB_VERBOSE=1 npm run init-db
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== 'CRON_SECRET') continue;
    let val = trimmed.slice(eq + 1).trim();
    const commentIdx = val.indexOf('#');
    if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
    val = val.replace(/^["']|["']$/g, '');
    return val;
  }
  return null;
}

let cronSecret = process.env.CRON_SECRET;
if (!cronSecret) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: CRON_SECRET not set. Pass it as env var or add to .env.local');
    process.exit(1);
  }
  cronSecret = parseEnvFile(envPath);
}

if (!cronSecret) {
  console.error('Error: CRON_SECRET not found in .env.local or env');
  process.exit(1);
}

const url = process.env.INIT_DB_URL || 'http://localhost:3000/api/init-db';
const verbose = process.env.INIT_DB_VERBOSE === '1';

if (verbose) {
  console.log('URL:', url);
  console.log('CRON_SECRET length:', cronSecret.length);
  console.log('First 4 chars:', cronSecret.slice(0, 4) + '...');
}

fetch(url, {
  method: 'GET',
  headers: { Authorization: `Bearer ${cronSecret}` },
})
  .then((res) => res.json().then((body) => ({ status: res.status, body })))
  .then(({ status, body }) => {
    if (status === 200) {
      console.log('✓ init-db succeeded:', JSON.stringify(body, null, 2));
    } else {
      console.error('✗ init-db failed:', status, body);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
