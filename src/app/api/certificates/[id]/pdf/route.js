import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema } from '@/lib/db-lms';
import { generateCertificatePdf } from '@/lib/certificates';
import { getUserFromRequest } from '@/lib/auth';
import { getAdminFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 });

    const user = await getUserFromRequest(request);
    const admin = !user ? await getAdminFromRequest(request) : null;
    const verifyCode = new URL(request.url).searchParams.get('code');

    await ensureLmsSchema();
    const result = await sql`
      SELECT c.*, u.first_name, u.last_name, co.name AS cohort_name, t.track_name
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN cohorts co ON co.id = c.cohort_id
      LEFT JOIN tracks t ON t.id = co.track_id
      WHERE c.id = ${id}
      LIMIT 1;
    `;
    if (result.rows.length > 0) {
      const cert = result.rows[0];
      const isOwner = user && cert.user_id === user.id;
      if (!isOwner && !admin && cert.verification_code !== verifyCode) {
        return NextResponse.json({ error: 'Unauthorized – provide a valid verification code' }, { status: 401 });
      }
    }
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }
    const cert = result.rows[0];
    const fullName = `${cert.first_name || ''} ${cert.last_name || ''}`.trim() || 'Learner';
    const { buffer } = await generateCertificatePdf({
      name: fullName,
      track: cert.track_name || 'CVERSE Academy',
      cohort: cert.cohort_name || '',
      issuedAt: cert.issued_at,
      certificateNumber: cert.certificate_number,
    });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${cert.certificate_number}.pdf"`,
      },
    });
  } catch (e) {
    reportError(e, { route: 'GET /api/certificates/[id]/pdf' });
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
}
