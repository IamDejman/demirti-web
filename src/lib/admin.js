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
  let updateFields = [];
  let updateValues = [];
  
  if (updates.email !== undefined) {
    updateFields.push('email');
    updateValues.push(updates.email);
  }
  if (updates.password !== undefined) {
    updateFields.push('password_hash');
    updateValues.push(await hashPassword(updates.password));
  }
  if (updates.firstName !== undefined) {
    updateFields.push('first_name');
    updateValues.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    updateFields.push('last_name');
    updateValues.push(updates.lastName);
  }
  if (updates.isActive !== undefined) {
    updateFields.push('is_active');
    updateValues.push(updates.isActive);
  }
  
  if (updateFields.length === 0) {
    return null;
  }
  
  const setParts = updateFields.map((field, index) => {
    const value = updateValues[index];
    if (field === 'email') {
      return sql`email = ${value}`;
    } else if (field === 'password_hash') {
      return sql`password_hash = ${value}`;
    } else if (field === 'first_name') {
      return sql`first_name = ${value}`;
    } else if (field === 'last_name') {
      return sql`last_name = ${value}`;
    } else if (field === 'is_active') {
      return sql`is_active = ${value}`;
    }
  }).filter(Boolean);
  
  const setClause = sql.join(setParts, sql`, `);
  
  const result = await sql`
    UPDATE admins
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING id, email, first_name, last_name, is_active, created_at, updated_at, last_login;
  `;
  
  return result.rows[0] || null;
}

export async function verifyAdminCredentials(email, password) {
  if (!email || !password) {
    console.log('verifyAdminCredentials: Missing email or password');
    return null;
  }

  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email.toLowerCase().trim();
  
  const admin = await getAdminByEmail(normalizedEmail);
  
  if (!admin) {
    console.log('verifyAdminCredentials: Admin not found for email:', normalizedEmail);
    return null;
  }
  
  if (!admin.is_active) {
    console.log('verifyAdminCredentials: Admin account is disabled for email:', normalizedEmail);
    throw new Error('Admin account is disabled');
  }
  
  // Check if stored hash is bcrypt format (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = admin.password_hash && (
    admin.password_hash.startsWith('$2a$') ||
    admin.password_hash.startsWith('$2b$') ||
    admin.password_hash.startsWith('$2y$')
  );
  
  let passwordMatches = false;
  
  if (isBcryptHash) {
    // Use bcrypt comparison for bcrypt hashes
    passwordMatches = await verifyPassword(password, admin.password_hash);
    console.log('verifyAdminCredentials: Using bcrypt verification');
  } else {
    // Fallback to SHA-256 for legacy hashes (shouldn't happen with new code)
    const crypto = await import('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    passwordMatches = admin.password_hash === passwordHash;
    console.log('verifyAdminCredentials: Using SHA-256 verification (legacy)');
  }
  
  console.log('verifyAdminCredentials: Password match result:', passwordMatches);
  
  if (passwordMatches) {
    // Update last login
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
  
  console.log('verifyAdminCredentials: Password mismatch for email:', normalizedEmail);
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

