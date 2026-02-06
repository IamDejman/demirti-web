import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { getAuditLogs } from '@/lib/audit';

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = ['created_at', 'user_email', 'action', 'target_type', 'target_id', 'ip_address'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h] ?? '';
      const safe = String(val).replace(/\"/g, '\"\"');
      return `"${safe}"`;
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);
    const format = searchParams.get('format');
    const logs = await getAuditLogs({ limit, search });
    if (format === 'csv') {
      const csv = toCsv(logs);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        },
      });
    }
    return NextResponse.json({ logs });
  } catch (e) {
    console.error('GET /api/admin/audit-logs:', e);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
