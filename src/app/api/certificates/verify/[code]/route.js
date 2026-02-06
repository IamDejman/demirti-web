import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request, { params }) {
  try {
    const code = params?.code;
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
    await ensureLmsSchema();
    const result = await sql`
      SELECT c.*, u.first_name, u.last_name, u.email, co.name AS cohort_name, t.track_name
      FROM certificates c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN cohorts co ON co.id = c.cohort_id
      LEFT JOIN tracks t ON t.id = co.track_id
      WHERE c.verification_code = ${code} OR c.certificate_number = ${code}
      LIMIT 1;
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }
    const cert = result.rows[0];
    return NextResponse.json({
      certificate: {
        id: cert.id,
        certificate_number: cert.certificate_number,
        verification_code: cert.verification_code,
        issued_at: cert.issued_at,
        user: {
          first_name: cert.first_name,
          last_name: cert.last_name,
          email: cert.email,
        },
        cohort_name: cert.cohort_name,
        track_name: cert.track_name,
        pdf_url: `/api/certificates/${cert.id}/pdf`,
      },
    });
  } catch (e) {
    console.error('GET /api/certificates/verify/[code]:', e);
    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 });
  }
}
