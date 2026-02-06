import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    const body = await request.json();
    const { eventKey, titleTemplate, bodyTemplate, emailEnabled, inAppEnabled } = body;
    if (!eventKey?.trim()) return NextResponse.json({ error: 'eventKey required' }, { status: 400 });
    await ensureLmsSchema();
    const result = await sql`
      UPDATE notification_templates
      SET event_key = ${eventKey.trim()},
          title_template = ${titleTemplate || null},
          body_template = ${bodyTemplate || null},
          email_enabled = ${emailEnabled !== false},
          in_app_enabled = ${inAppEnabled !== false},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rows.length === 0) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'notification_template.update',
      targetType: 'notification_template',
      targetId: id,
      details: { eventKey: result.rows[0].event_key },
      ipAddress,
    });
    return NextResponse.json({ template: result.rows[0] });
  } catch (e) {
    console.error('PUT /api/admin/notification-templates/[id]:', e);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM notification_templates WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'notification_template.delete',
      targetType: 'notification_template',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/notification-templates/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
