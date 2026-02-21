import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { reportError } from '@/lib/logger';
import { getAuditLogs } from '@/lib/audit';
import { formatTimeLagos } from '@/lib/dateUtils';

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = ['created_at_lagos', 'user_email', 'action', 'page', 'target_type', 'target_id', 'ip_address'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    const actionDisplay = row.action === 'page.view' ? 'Viewed page' : (row.action ?? '');
    const pagePath = row.action === 'page.view' ? (row.details?.path ?? row.target_id ?? '') : '';
    const values = [
      formatTimeLagos(row.created_at),
      row.user_email ?? '',
      actionDisplay,
      pagePath,
      row.target_type ?? '',
      row.target_id ?? '',
      row.ip_address ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
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
    reportError(e, { route: 'GET /api/admin/audit-logs' });
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
