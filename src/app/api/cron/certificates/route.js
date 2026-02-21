import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { ensureLmsSchema, recordLmsEvent } from '@/lib/db-lms';
import { withTransaction } from '@/lib/transaction';

function generateCode(prefix) {
  return `${prefix}-${crypto.randomBytes(16).toString('hex')}`.toUpperCase();
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureLmsSchema();
    const eligibleRes = await sql`
      SELECT cs.id, cs.student_id, cs.cohort_id
      FROM cohort_students cs
      WHERE cs.status = 'completed' AND cs.certificate_issued = false
      LIMIT 200;
    `;
    const issued = [];
    for (const row of eligibleRes.rows) {
      try {
        const result = await withTransaction(async (client) => {
          const existing = await client.sql`
            SELECT id FROM certificates
            WHERE user_id = ${row.student_id} AND cohort_id = ${row.cohort_id}
            LIMIT 1;
          `;
          let certId = existing.rows[0]?.id;
          if (!certId) {
            const certificateNumber = generateCode('CV');
            const verificationCode = generateCode('VERIFY');
            const certRes = await client.sql`
              INSERT INTO certificates (user_id, cohort_id, certificate_number, verification_code)
              VALUES (${row.student_id}, ${row.cohort_id}, ${certificateNumber}, ${verificationCode})
              RETURNING id;
            `;
            certId = certRes.rows[0].id;
          }
          const pdfUrl = certId ? `/api/certificates/${certId}/pdf` : null;
          await client.sql`
            UPDATE cohort_students
            SET certificate_issued = true,
                certificate_url = ${pdfUrl}
            WHERE id = ${row.id};
          `;
          return { studentId: row.student_id, cohortId: row.cohort_id, certificateId: certId };
        });
        await recordLmsEvent(row.student_id, 'certificate_auto_issued', { cohortId: row.cohort_id });
        issued.push(result);
      } catch (rowErr) {
        reportError(rowErr, { route: 'GET /api/cron/certificates', studentId: row.student_id });
      }
    }
    return NextResponse.json({ issued });
  } catch (e) {
    reportError(e, { route: 'GET /api/cron/certificates' });
    return NextResponse.json({ error: 'Failed to auto-issue certificates' }, { status: 500 });
  }
}
