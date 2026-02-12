/**
 * LMS user authentication: users table + user_sessions.
 * Use for student, facilitator, and admin (when migrated to users table).
 */
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ensureLmsSchema } from './db-lms';
import { generateReferralCode } from './db-lms';

const SESSION_TTL_DAYS = 7;

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  return await bcrypt.compare(password, hash);
}

/** Create a new user (guest or student). */
export async function createUser({ email, password, firstName, lastName, role = 'student' }) {
  await ensureLmsSchema();
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) throw new Error('Email is required');
  const passwordHash = password ? await hashPassword(password) : null;
  let referralCode = generateReferralCode();
  const existing = await sql`SELECT 1 FROM users WHERE referral_code = ${referralCode} LIMIT 1`;
  while (existing.rows.length > 0) {
    referralCode = generateReferralCode();
    const again = await sql`SELECT 1 FROM users WHERE referral_code = ${referralCode} LIMIT 1`;
    if (again.rows.length === 0) break;
  }
  try {
    const result = await sql`
      INSERT INTO users (email, password_hash, role, first_name, last_name, referral_code)
      VALUES (${normalizedEmail}, ${passwordHash}, ${role}, ${firstName || null}, ${lastName || null}, ${referralCode})
      RETURNING id, email, role, first_name, last_name, referral_code, created_at;
    `;
    return result.rows[0];
  } catch (e) {
    if (e.code === '23505') throw new Error('An account with this email already exists');
    throw e;
  }
}

export async function getUserByEmail(email) {
  await ensureLmsSchema();
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const result = await sql`
    SELECT id, email, password_hash, role, first_name, last_name, profile_picture_url, bio, phone,
           timezone, language_preference, is_active, referral_code, referred_by_user_id, created_at, last_login_at,
           must_change_password
    FROM users
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function getUserById(id) {
  await ensureLmsSchema();
  if (!id) return null;
  const result = await sql`
    SELECT id, email, role, first_name, last_name, profile_picture_url, bio, phone,
           timezone, language_preference, is_active, referral_code, created_at, last_login_at
    FROM users
    WHERE id = ${id}
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createUserSession(userId, token) {
  await ensureLmsSchema();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  await sql`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt});
  `;
}

export async function getUserByToken(token) {
  if (!token || typeof token !== 'string') return null;
  await ensureLmsSchema();
  const result = await sql`
    SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.profile_picture_url, u.phone, u.address, u.years_experience, u.is_active, u.suspended_until, u.must_change_password
    FROM users u
    JOIN user_sessions s ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.is_active = true
      AND (u.suspended_until IS NULL OR u.suspended_until < CURRENT_TIMESTAMP)
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function deleteUserSession(token) {
  if (!token) return;
  await ensureLmsSchema();
  await sql`DELETE FROM user_sessions WHERE token = ${token}`;
}

export async function verifyUserCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) return null;
  if (!user.is_active) throw new Error('Account is disabled');
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;
  await sql`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    mustChangePassword: !!user.must_change_password,
  };
}

/** Generate a secure token for session */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Password reset (forgot-password OTP flow)
export async function createUserPasswordReset(email, otp, expiresAt) {
  await ensureLmsSchema();
  const normalizedEmail = email.toLowerCase().trim();
  await sql`DELETE FROM user_password_resets WHERE LOWER(email) = ${normalizedEmail}`;
  await sql`
    INSERT INTO user_password_resets (email, otp, expires_at)
    VALUES (${normalizedEmail}, ${otp}, ${expiresAt});
  `;
}

export async function getValidUserPasswordReset(email, otp) {
  await ensureLmsSchema();
  const normalizedEmail = email.toLowerCase().trim();
  const result = await sql`
    SELECT id, email, otp, expires_at
    FROM user_password_resets
    WHERE LOWER(email) = ${normalizedEmail}
      AND otp = ${String(otp).trim()}
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY expires_at DESC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function deleteUserPasswordReset(email) {
  await ensureLmsSchema();
  const normalizedEmail = email.toLowerCase().trim();
  await sql`DELETE FROM user_password_resets WHERE LOWER(email) = ${normalizedEmail}`;
}

/** Get password hash for a user (for verification only). Returns null if user has no password. */
export async function getPasswordHashByUserId(userId) {
  await ensureLmsSchema();
  const result = await sql`SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1`;
  return result.rows[0]?.password_hash ?? null;
}

export async function updateUserPassword(userId, newPassword) {
  await ensureLmsSchema();
  const passwordHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${passwordHash}, must_change_password = false WHERE id = ${userId}`;
}

/** Get current user from request: Authorization Bearer or cookie lms_token */
export async function getUserFromRequest(request) {
  let token = null;
  const authHeader = request?.headers?.get?.('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token && request?.headers?.get) {
    const cookie = request.headers.get('cookie');
    if (cookie) {
      const m = cookie.match(/lms_token=([^;]+)/);
      if (m) token = m[1].trim();
    }
  }
  if (!token) return null;
  return getUserByToken(token);
}
