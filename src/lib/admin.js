import './env-db';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { ensureDatabaseInitialized } from './db';

// Hash password using bcrypt
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password using bcrypt
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Admin CRUD functions
export async function createAdmin({ email, password, firstName, lastName }) {
  await ensureDatabaseInitialized();
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);
  
  try {
    const result = await sql`
      INSERT INTO admins (email, password_hash, first_name, last_name, is_active)
      VALUES (${normalizedEmail}, ${passwordHash}, ${firstName || null}, ${lastName || null}, true)
      RETURNING id, email, first_name, last_name, is_active, created_at;
    `;
    
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Admin with this email already exists');
    }
    throw error;
  }
}

export async function getAdminByEmail(email) {
  await ensureDatabaseInitialized();
  if (!email) {
    return null;
  }

  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email.toLowerCase().trim();

  const result = await sql`
    SELECT id, email, password_hash, first_name, last_name, is_active, created_at, last_login
    FROM admins
    WHERE LOWER(email) = LOWER(${normalizedEmail})
    LIMIT 1;
  `;
  
  return result.rows[0] || null;
}

export async function getAllAdmins() {
  const result = await sql`
    SELECT id, email, first_name, last_name, is_active, created_at, updated_at, last_login
    FROM admins
    ORDER BY created_at DESC;
  `;
  
  return result.rows;
}

export async function updateAdmin(id, updates) {
  const hasUpdates = updates && (
    updates.email !== undefined ||
    updates.password !== undefined ||
    updates.firstName !== undefined ||
    updates.lastName !== undefined ||
    updates.isActive !== undefined
  );
  if (!hasUpdates) return null;

  if (updates.password !== undefined) {
    const passwordHash = await hashPassword(updates.password);
    const result = await sql`
      UPDATE admins
      SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, first_name, last_name, is_active, created_at, updated_at, last_login;
    `;
    if (Object.keys(updates).length === 1) return result.rows[0] || null;
  }
  if (updates.email !== undefined) {
    await sql`
      UPDATE admins SET email = ${updates.email}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id};
    `;
  }
  if (updates.firstName !== undefined) {
    await sql`
      UPDATE admins SET first_name = ${updates.firstName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id};
    `;
  }
  if (updates.lastName !== undefined) {
    await sql`
      UPDATE admins SET last_name = ${updates.lastName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id};
    `;
  }
  if (updates.isActive !== undefined) {
    await sql`
      UPDATE admins SET is_active = ${updates.isActive}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id};
    `;
  }
  const result = await sql`
    SELECT id, email, first_name, last_name, is_active, created_at, updated_at, last_login
    FROM admins WHERE id = ${id};
  `;
  return result.rows[0] || null;
}

export async function verifyAdminCredentials(email, password) {
  if (!email || !password) return null;

  const normalizedEmail = email.toLowerCase().trim();
  const admin = await getAdminByEmail(normalizedEmail);
  if (!admin) return null;

  if (!admin.is_active) {
    throw new Error('Admin account is disabled');
  }

  const passwordMatches = await verifyPassword(password, admin.password_hash);

  if (passwordMatches) {
    await sql`
      UPDATE admins
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${admin.id};
    `;
    return {
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name
    };
  }

  return null;
}

export async function disableAdmin(id) {
  const result = await sql`
    UPDATE admins
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, email, is_active;
  `;
  
  return result.rows[0] || null;
}

export async function enableAdmin(id) {
  const result = await sql`
    UPDATE admins
    SET is_active = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, email, is_active;
  `;
  
  return result.rows[0] || null;
}

// Password reset (forgot-password OTP flow)
export async function createPasswordReset(email, otp, expiresAt) {
  await ensureDatabaseInitialized();
  const normalizedEmail = email.toLowerCase().trim();
  await sql`
    INSERT INTO admin_password_resets (email, otp, expires_at)
    VALUES (${normalizedEmail}, ${otp}, ${expiresAt});
  `;
}

export async function getValidPasswordReset(email, otp) {
  await ensureDatabaseInitialized();
  const normalizedEmail = email.toLowerCase().trim();
  const result = await sql`
    SELECT id, email, otp, expires_at
    FROM admin_password_resets
    WHERE LOWER(email) = ${normalizedEmail}
      AND otp = ${otp}
      AND expires_at > CURRENT_TIMESTAMP
    ORDER BY expires_at DESC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function deletePasswordReset(email) {
  await ensureDatabaseInitialized();
  const normalizedEmail = email.toLowerCase().trim();
  await sql`
    DELETE FROM admin_password_resets
    WHERE LOWER(email) = ${normalizedEmail};
  `;
}

// Admin session (token) for API auth
const SESSION_TTL_DAYS = 7;

export async function createAdminSession(adminId, token) {
  await ensureDatabaseInitialized();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  await sql`
    INSERT INTO admin_sessions (admin_id, token, expires_at)
    VALUES (${adminId}, ${token}, ${expiresAt})
  `;
}

export async function getAdminByToken(token) {
  if (!token || typeof token !== 'string') return null;
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT a.id, a.email, a.first_name, a.last_name, a.is_active
    FROM admins a
    JOIN admin_sessions s ON s.admin_id = a.id
    WHERE s.token = ${token} AND s.expires_at > CURRENT_TIMESTAMP AND a.is_active = true
    LIMIT 1
  `;
  return result.rows[0] || null;
}

export async function deleteAdminSession(token) {
  if (!token) return;
  await ensureDatabaseInitialized();
  await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
}
