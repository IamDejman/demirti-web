import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    const body = await request.json();
    const { cohortId } = body || {};
    if (!cohortId) return NextResponse.json({ error: 'cohortId is required' }, { status: 400 });
    await ensureLmsSchema();
    const templateRes = await sql`SELECT * FROM course_templates WHERE id = ${id} LIMIT 1;`;
    const template = templateRes.rows[0];
    if (!template || !template.data?.weeks) {
      return NextResponse.json({ error: 'Template not found or empty' }, { status: 404 });
    }
    const createdWeeks = [];
    for (const week of template.data.weeks) {
      const weekRes = await sql`
        INSERT INTO weeks (cohort_id, week_number, title, description, unlock_date, live_class_datetime, google_meet_link, is_locked)
        VALUES (
          ${cohortId},
          ${week.week_number},
          ${week.title},
          ${week.description || null},
          ${week.unlock_date || null},
          ${week.live_class_datetime || null},
          ${week.google_meet_link || null},
          ${week.is_locked ?? true}
        )
        ON CONFLICT (cohort_id, week_number) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          unlock_date = EXCLUDED.unlock_date,
          live_class_datetime = EXCLUDED.live_class_datetime,
          google_meet_link = EXCLUDED.google_meet_link,
          is_locked = EXCLUDED.is_locked
        RETURNING *;
      `;
      const createdWeek = weekRes.rows[0];
      createdWeeks.push(createdWeek);

      for (const item of week.content_items || []) {
        await sql`
          INSERT INTO content_items (week_id, type, title, description, file_url, external_url, order_index, is_downloadable)
          VALUES (
            ${createdWeek.id},
            ${item.type},
            ${item.title},
            ${item.description || null},
            ${item.file_url || null},
            ${item.external_url || null},
            ${item.order_index || 0},
            ${item.is_downloadable || false}
          );
        `;
      }
      for (const mat of week.materials || []) {
        await sql`
          INSERT INTO materials (week_id, type, title, description, url, file_url)
          VALUES (
            ${createdWeek.id},
            ${mat.type},
            ${mat.title},
            ${mat.description || null},
            ${mat.url || null},
            ${mat.file_url || null}
          );
        `;
      }
      for (const assignment of week.assignments || []) {
        await sql`
          INSERT INTO assignments (week_id, cohort_id, title, description, submission_type, allowed_file_types, max_file_size_mb, deadline_at, max_score, is_published, publish_at, created_by)
          VALUES (
            ${createdWeek.id},
            ${cohortId},
            ${assignment.title},
            ${assignment.description || null},
            ${assignment.submission_type},
            ${assignment.allowed_file_types || null},
            ${assignment.max_file_size_mb || null},
            ${assignment.deadline_at || new Date()},
            ${assignment.max_score || 100},
            ${assignment.is_published ?? false},
            ${assignment.publish_at || null},
            ${assignment.created_by || null}
          );
        `;
      }
    }
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'course_template.apply',
      targetType: 'course_template',
      targetId: id,
      details: { cohortId, weeksCreated: createdWeeks.length },
      ipAddress,
    });
    return NextResponse.json({ success: true, weeksCreated: createdWeeks.length });
  } catch (e) {
    console.error('POST /api/admin/course-templates/[id]/apply:', e);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}
