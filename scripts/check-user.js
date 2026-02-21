#!/usr/bin/env node
/**
 * Check if an email exists in the users table.
 * Usage: node scripts/check-user.js [email]
 * Uses .env in project root for POSTGRES_URL.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    const commentIdx = val.indexOf('#');
    if (commentIdx !== -1) val = val.slice(0, commentIdx).trim();
    val = val.replace(/^["']|["']$/g, '');
    if (key === 'POSTGRES_URL' || key === 'NEW_POSTGRES_URL') process.env[key] = val;
  }
}
if (!process.env.POSTGRES_URL && process.env.NEW_POSTGRES_URL) process.env.POSTGRES_URL = process.env.NEW_POSTGRES_URL;

const email = (process.argv[2] || 'ayodejieluwande@gmail.com').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/check-user.js [email]');
  process.exit(1);
}

async function main() {
  const { sql } = await import('@vercel/postgres');
  const result = await sql`
    SELECT id, email, role, first_name, last_name,
           (password_hash IS NOT NULL) AS has_password, created_at
    FROM users
    WHERE LOWER(email) = ${email}
    LIMIT 1;
  `;
  const user = result.rows[0];
  if (!user) {
    console.log('No user found with email:', email);
    return;
  }
  console.log('User found:');
  console.log(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    has_password: user.has_password,
    created_at: user.created_at,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
