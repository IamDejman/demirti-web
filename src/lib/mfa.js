/**
 * TOTP (Time-based One-Time Password) implementation for admin MFA.
 * RFC 6238 compliant. No external dependencies — uses Node.js crypto.
 */
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { ensureDatabaseInitialized } from './db';

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // allow ±1 time step

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return result;
}

export function base32Decode(str) {
  let bits = '';
  for (const char of str.toUpperCase().replace(/=+$/, '')) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Generate a random 20-byte TOTP secret, returned as base32 string. */
export function generateTotpSecret() {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/** Generate a TOTP code for a given secret and time. */
export function generateTotp(secretBase32, timeMs = Date.now()) {
  const secretBuffer = base32Decode(secretBase32);
  const counter = Math.floor(timeMs / 1000 / TOTP_PERIOD);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(0, 0);
  counterBuffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % (10 ** TOTP_DIGITS);

  return code.toString().padStart(TOTP_DIGITS, '0');
}

/** Verify a TOTP code with a ±1 time step window. Uses timing-safe comparison. */
export function verifyTotp(secretBase32, code) {
  if (!code || typeof code !== 'string' || code.length !== TOTP_DIGITS) return false;
  const now = Date.now();
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const expected = generateTotp(secretBase32, now + i * TOTP_PERIOD * 1000);
    if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

/** Generate an otpauth:// URI for authenticator apps. */
export function generateTotpUri(secretBase32, email, issuer = 'CVERSE Admin') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// --- Database operations for admin MFA ---

let mfaTablesReady = false;

/** Ensure MFA tables exist (cached after first successful check). */
export async function ensureMfaTables() {
  if (mfaTablesReady) return;
  await ensureDatabaseInitialized();

  const mfaCheck = await sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_mfa');
  `;
  if (!mfaCheck.rows[0].exists) {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_mfa (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL UNIQUE REFERENCES admins(id) ON DELETE CASCADE,
        secret VARCHAR(64) NOT NULL,
        is_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_mfa_admin_id ON admin_mfa(admin_id)`;
  }

  const challengeCheck = await sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_mfa_challenges');
  `;
  if (!challengeCheck.rows[0].exists) {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_mfa_challenges (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_mfa_challenges_token ON admin_mfa_challenges(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_mfa_challenges_expires ON admin_mfa_challenges(expires_at)`;
  } else {
    // Migration: add ip_address column if it doesn't exist (for pre-existing tables)
    const colCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'admin_mfa_challenges' AND column_name = 'ip_address'
      );
    `;
    if (!colCheck.rows[0].exists) {
      await sql`ALTER TABLE admin_mfa_challenges ADD COLUMN ip_address VARCHAR(45)`;
    }
  }

  mfaTablesReady = true;
}

/** Get MFA record for an admin. Returns { secret, is_enabled } or null. */
export async function getAdminMfa(adminId) {
  await ensureMfaTables();
  const result = await sql`
    SELECT secret, is_enabled FROM admin_mfa WHERE admin_id = ${adminId} LIMIT 1;
  `;
  return result.rows[0] || null;
}

/** Save or update MFA secret (not yet enabled). */
export async function saveAdminMfaSecret(adminId, secret) {
  await ensureMfaTables();
  await sql`
    INSERT INTO admin_mfa (admin_id, secret, is_enabled)
    VALUES (${adminId}, ${secret}, false)
    ON CONFLICT (admin_id)
    DO UPDATE SET secret = ${secret}, is_enabled = false, created_at = CURRENT_TIMESTAMP;
  `;
}

/** Enable MFA for an admin (after successful verification). */
export async function enableAdminMfa(adminId) {
  await ensureMfaTables();
  await sql`UPDATE admin_mfa SET is_enabled = true WHERE admin_id = ${adminId}`;
}

/** Disable and delete MFA for an admin. */
export async function deleteAdminMfa(adminId) {
  await ensureMfaTables();
  await sql`DELETE FROM admin_mfa WHERE admin_id = ${adminId}`;
}

/** Create a short-lived MFA challenge token (5 min), bound to IP. */
export async function createMfaChallenge(adminId, ipAddress) {
  await ensureMfaTables();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await sql`
    INSERT INTO admin_mfa_challenges (admin_id, token, expires_at, ip_address)
    VALUES (${adminId}, ${token}, ${expiresAt}, ${ipAddress || null});
  `;
  return token;
}

/** Look up an MFA challenge without consuming it. Returns admin_id or null. */
export async function peekMfaChallenge(token, ipAddress) {
  if (!token || typeof token !== 'string') return null;
  await ensureMfaTables();
  const result = await sql`
    SELECT admin_id FROM admin_mfa_challenges
    WHERE token = ${token}
      AND expires_at > CURRENT_TIMESTAMP
      AND (ip_address IS NULL OR ip_address = ${ipAddress || ''})
    LIMIT 1;
  `;
  return result.rows[0]?.admin_id ?? null;
}

/** Consume (delete) an MFA challenge token after successful verification. Returns admin_id or null. */
export async function consumeMfaChallenge(token) {
  if (!token || typeof token !== 'string') return null;
  await ensureMfaTables();
  const result = await sql`
    DELETE FROM admin_mfa_challenges
    WHERE token = ${token} AND expires_at > CURRENT_TIMESTAMP
    RETURNING admin_id;
  `;
  return result.rows[0]?.admin_id ?? null;
}
