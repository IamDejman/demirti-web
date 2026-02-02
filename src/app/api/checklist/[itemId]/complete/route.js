import { NextResponse } from 'next/server';
import { completeChecklistItem } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

async function isStudentInWeekWeek(itemId, studentId) {
  await ensureLmsSchema();
  const r = await sql`
    SELECT 1 FROM weekly_checklist_items wci
    JOIN cohort_students cs ON cs.cohort_id = (SELECT cohort_id FROM weeks WHERE id = wci.week_id)
    WHERE wci.id = ${itemId} AND cs.student_id = ${studentId} LIMIT 1;
  `;
  return r.rows.length > 0;
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'student' && user.role !== 'alumni') {
      return NextResponse.json({ error: 'Only students can complete checklist items' }, { status: 403 });
    }
    const itemId = params?.itemId;
    if (!itemId) return NextResponse.json({ error: 'Checklist item ID required' }, { status: 400 });
    const allowed = await isStudentInWeekWeek(itemId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await completeChecklistItem(user.id, itemId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/checklist/[itemId]/complete:', e);
    return NextResponse.json({ error: 'Failed to complete item' }, { status: 500 });
  }
}
