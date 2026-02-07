import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function DELETE(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Certificate ID required' }, { status: 400 });
    await ensureLmsSchema();
    await sql`DELETE FROM certificates WHERE id = ${id}`;
    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'certificate.delete',
      targetType: 'certificate',
      targetId: id,
      ipAddress,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/admin/certificates/[id]:', e);
    return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
  }
}
