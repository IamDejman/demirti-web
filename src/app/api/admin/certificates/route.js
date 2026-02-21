import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getUserByEmail } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

function generateCode(prefix) {
  return `${prefix}-${crypto.randomBytes(16).toString('hex')}`.toUpperCase();
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const result = await sql`
      SELECT c.*, u.email, u.first_name, u.last_name, co.name AS cohort_name
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN cohorts co ON co.id = c.cohort_id
      ORDER BY c.issued_at DESC;
    `;
    return NextResponse.json({ certificates: result.rows });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/certificates' });
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { email, userId, cohortId } = body || {};
    if (!email && !userId) {
      return NextResponse.json({ error: 'email or userId required' }, { status: 400 });
    }
    await ensureLmsSchema();
    let user = null;
    if (userId) {
      const res = await sql`SELECT id, email FROM users WHERE id = ${userId} LIMIT 1;`;
      user = res.rows[0];
    } else {
      user = await getUserByEmail(email);
    }
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const certificateNumber = generateCode('CV');
    const verificationCode = generateCode('VERIFY');
    const result = await sql`
      INSERT INTO certificates (user_id, cohort_id, certificate_number, verification_code)
      VALUES (${user.id}, ${cohortId || null}, ${certificateNumber}, ${verificationCode})
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'certificate.issue',
      targetType: 'certificate',
      targetId: result.rows[0].id,
      details: { userId: user.id, certificateNumber },
      ipAddress,
    });
    return NextResponse.json({ certificate: result.rows[0] });
  } catch (e) {
    reportError(e, { route: 'POST /api/admin/certificates' });
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}
