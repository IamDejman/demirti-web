import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from './db-lms';

export async function recordAuditLog({ userId, action, targetType, targetId, details, ipAddress }) {
  await ensureLmsSchema();
  if (!action) return;
  const isUuid = typeof userId === 'string' && /^[0-9a-f-]{36}$/i.test(userId);
  const safeUserId = isUuid ? userId : null;
  await sql`
    INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
    VALUES (
      ${safeUserId},
      ${action},
      ${targetType || null},
      ${targetId ? String(targetId) : null},
      ${details ? JSON.stringify(details) : null},
      ${ipAddress || null}
    );
  `;
}

export async function getAuditLogs({ limit = 200, search = '' } = {}) {
  await ensureLmsSchema();
  const q = search ? `%${search}%` : null;
  const result = await sql`
    SELECT a.*, u.email AS user_email
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ${q ? sql`WHERE a.action ILIKE ${q} OR a.target_type ILIKE ${q} OR a.target_id ILIKE ${q} OR u.email ILIKE ${q}` : sql``}
    ORDER BY a.created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}
