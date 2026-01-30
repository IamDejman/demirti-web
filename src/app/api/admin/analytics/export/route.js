import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import {
  getEventsForExport,
  getSessionsForExport,
  getDailyStatsForExport,
  getGoalsPerformance,
  getFunnelPerformance,
} from '@/lib/analyticsQueries';
import { getAllFunnels } from '@/lib/db';

function escapeCsvCell(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => escapeCsvCell(row[col])).join(','));
  return [header, ...lines].join('\n');
}

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (!type || !startParam || !endParam) {
      return NextResponse.json({ error: 'type, start, and end are required' }, { status: 400 });
    }
    const start = new Date(startParam);
    const end = new Date(endParam);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end date' }, { status: 400 });
    }

    let csv = '';
    let filename = '';

    switch (type) {
      case 'events': {
        const rows = await getEventsForExport(start, end, 10000);
        const columns = ['id', 'type', 'name', 'session_id', 'visitor_id', 'url', 'referrer', 'traffic_channel', 'device_type', 'browser', 'os', 'country', 'city', 'page_duration_seconds', 'scroll_depth_percent', 'created_at'];
        csv = rowsToCsv(rows, columns);
        filename = `analytics-events-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
        break;
      }
      case 'sessions': {
        const rows = await getSessionsForExport(start, end, 10000);
        const columns = ['session_id', 'visitor_id', 'started_at', 'ended_at', 'duration_seconds', 'pageview_count', 'event_count', 'entry_page', 'exit_page', 'bounced', 'device_type', 'browser', 'os', 'country', 'city', 'traffic_channel', 'utm_source', 'utm_medium', 'utm_campaign', 'is_new_visitor', 'last_activity_at'];
        csv = rowsToCsv(rows, columns);
        filename = `analytics-sessions-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
        break;
      }
      case 'daily_stats': {
        const rows = await getDailyStatsForExport(start, end);
        const columns = ['date', 'traffic_channel', 'device_type', 'country', 'pageviews', 'unique_visitors', 'sessions', 'bounces', 'total_duration_seconds'];
        csv = rowsToCsv(rows, columns);
        filename = `analytics-daily-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
        break;
      }
      case 'goals': {
        const rows = await getGoalsPerformance(start, end);
        const columns = ['id', 'name', 'type', 'match_value', 'match_type', 'completions', 'completionRate'];
        csv = rowsToCsv(rows, columns);
        filename = `analytics-goals-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
        break;
      }
      case 'funnels': {
        const funnels = await getAllFunnels();
        const lines = ['funnel_id,funnel_name,step_label,count,conversion_rate'];
        for (const f of funnels) {
          const perf = await getFunnelPerformance(f.id, start, end);
          perf.steps.forEach((step, i) => {
            lines.push(`${f.id},${escapeCsvCell(f.name)},${escapeCsvCell(step.label)},${step.count},${i === perf.steps.length - 1 ? perf.conversionRate : ''}`);
          });
        }
        csv = lines.join('\n');
        filename = `analytics-funnels-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid type. Use events|sessions|daily_stats|goals|funnels' }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json({ error: 'Export failed', details: error.message }, { status: 500 });
  }
}
