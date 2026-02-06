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
    const result = await sql`
      SELECT * FROM notification_templates ORDER BY event_key ASC;
    `;
    return NextResponse.json({ templates: result.rows });
  } catch (e) {
    console.error('GET /api/admin/notification-templates:', e);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { eventKey, titleTemplate, bodyTemplate, emailEnabled, inAppEnabled } = body;
    if (!eventKey?.trim()) return NextResponse.json({ error: 'eventKey required' }, { status: 400 });
    await ensureLmsSchema();
    const result = await sql`
      INSERT INTO notification_templates (event_key, title_template, body_template, email_enabled, in_app_enabled, updated_at)
      VALUES (${eventKey.trim()}, ${titleTemplate || null}, ${bodyTemplate || null}, ${emailEnabled !== false}, ${inAppEnabled !== false}, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'notification_template.create',
      targetType: 'notification_template',
      targetId: result.rows[0].id,
      details: { eventKey: result.rows[0].event_key },
      ipAddress,
    });
    return NextResponse.json({ template: result.rows[0] });
  } catch (e) {
    console.error('POST /api/admin/notification-templates:', e);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
