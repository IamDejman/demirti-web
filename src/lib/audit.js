import './env-db';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from './db-lms';

export async function recordAuditLog({ userId, action, targetType, targetId, details, ipAddress, actorEmail }) {
  await ensureLmsSchema();
  if (!action) return;
  const isUuid = typeof userId === 'string' && /^[0-9a-f-]{36}$/i.test(userId);
  const safeUserId = isUuid ? userId : null;
  const mergedDetails = { ...(typeof details === 'object' && details !== null ? details : {}), ...(actorEmail ? { actor_email: actorEmail } : {}) };
  const detailsJson = Object.keys(mergedDetails).length > 0 ? JSON.stringify(mergedDetails) : null;
  await sql`
    INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
    VALUES (
      ${safeUserId},
      ${action},
      ${targetType || null},
      ${targetId ? String(targetId) : null},
      ${detailsJson},
      ${ipAddress || null}
    );
  `;
}

export async function getAuditLogs({ limit = 200, search = '' } = {}) {
  await ensureLmsSchema();
  const q = search ? `%${search}%` : null;
  const auditRows = await sql`
    SELECT a.*, COALESCE(u.email, a.details->>'actor_email') AS user_email
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE (${q}::text IS NULL OR a.action ILIKE ${q} OR a.target_type ILIKE ${q} OR a.target_id ILIKE ${q} OR COALESCE(u.email, a.details->>'actor_email') ILIKE ${q} OR a.details->>'path' ILIKE ${q})
    ORDER BY a.created_at DESC
    LIMIT ${limit};
  `;
  const lmsRows = await sql`
    SELECT e.id, e.user_id, e.name AS action, 'lms_event' AS target_type, NULL AS target_id, e.properties AS details, NULL AS ip_address, e.created_at, u.email AS user_email
    FROM lms_events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE (${q}::text IS NULL OR e.name ILIKE ${q})
    ORDER BY e.created_at DESC
    LIMIT ${Math.floor(limit / 2)};
  `;
  const lmsWithEmail = lmsRows.rows.map((row) => ({ ...row, user_email: row.user_email || 'System' }));
  const merged = [...auditRows.rows, ...lmsWithEmail]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
  return merged;
}
