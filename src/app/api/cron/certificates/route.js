import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema, recordLmsEvent } from '@/lib/db-lms';

function generateCode(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}-${Date.now().toString(36)}`.toUpperCase();
}

export async function GET() {
  try {
    await ensureLmsSchema();
    const eligibleRes = await sql`
      SELECT cs.id, cs.student_id, cs.cohort_id
      FROM cohort_students cs
      WHERE cs.status = 'completed' AND cs.certificate_issued = false
      LIMIT 200;
    `;
    const issued = [];
    for (const row of eligibleRes.rows) {
      const existing = await sql`
        SELECT id FROM certificates
        WHERE user_id = ${row.student_id} AND cohort_id = ${row.cohort_id}
        LIMIT 1;
      `;
      let certId = existing.rows[0]?.id;
      if (!certId) {
        const certificateNumber = generateCode('CV');
        const verificationCode = generateCode('VERIFY');
        const certRes = await sql`
          INSERT INTO certificates (user_id, cohort_id, certificate_number, verification_code)
          VALUES (${row.student_id}, ${row.cohort_id}, ${certificateNumber}, ${verificationCode})
          RETURNING id;
        `;
        certId = certRes.rows[0].id;
      }
      const pdfUrl = certId ? `/api/certificates/${certId}/pdf` : null;
      await sql`
        UPDATE cohort_students
        SET certificate_issued = true,
            certificate_url = ${pdfUrl}
        WHERE id = ${row.id};
      `;
      await recordLmsEvent(row.student_id, 'certificate_auto_issued', { cohortId: row.cohort_id });
      issued.push({ studentId: row.student_id, cohortId: row.cohort_id, certificateId: certId });
    }
    return NextResponse.json({ issued });
  } catch (e) {
    console.error('GET /api/cron/certificates:', e);
    return NextResponse.json({ error: 'Failed to auto-issue certificates' }, { status: 500 });
  }
}
