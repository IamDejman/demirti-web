import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureLmsSchema();
    const result = await sql`SELECT * FROM course_templates ORDER BY created_at DESC;`;
    return NextResponse.json({ templates: result.rows });
  } catch (e) {
    console.error('GET /api/admin/course-templates:', e);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, trackId, cohortId } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    await ensureLmsSchema();
    let data = null;
    if (cohortId) {
      const weeksRes = await sql`
        SELECT * FROM weeks WHERE cohort_id = ${cohortId} ORDER BY week_number ASC;
      `;
      const weekIds = weeksRes.rows.map((w) => w.id);
      const [contentRes, materialsRes, assignmentsRes] = await Promise.all([
        weekIds.length > 0 ? sql`SELECT * FROM content_items WHERE week_id = ANY(${weekIds}) ORDER BY order_index ASC;` : { rows: [] },
        weekIds.length > 0 ? sql`SELECT * FROM materials WHERE week_id = ANY(${weekIds});` : { rows: [] },
        weekIds.length > 0 ? sql`SELECT * FROM assignments WHERE week_id = ANY(${weekIds});` : { rows: [] },
      ]);
      data = {
        weeks: weeksRes.rows.map((week) => ({
          week_number: week.week_number,
          title: week.title,
          description: week.description,
          unlock_date: week.unlock_date,
          live_class_datetime: week.live_class_datetime,
          google_meet_link: week.google_meet_link,
          is_locked: week.is_locked,
          content_items: contentRes.rows.filter((c) => c.week_id === week.id),
          materials: materialsRes.rows.filter((m) => m.week_id === week.id),
          assignments: assignmentsRes.rows.filter((a) => a.week_id === week.id),
        })),
      };
    }
    const isUuid = typeof admin.id === 'string' && /^[0-9a-f-]{36}$/i.test(admin.id);
    const result = await sql`
      INSERT INTO course_templates (name, track_id, data, created_by)
      VALUES (${name.trim()}, ${trackId ? parseInt(trackId, 10) : null}, ${data ? JSON.stringify(data) : null}, ${isUuid ? admin.id : null})
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'course_template.create',
      targetType: 'course_template',
      targetId: result.rows[0].id,
      details: { name: result.rows[0].name },
      ipAddress,
    });
    return NextResponse.json({ template: result.rows[0] });
  } catch (e) {
    console.error('POST /api/admin/course-templates:', e);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
