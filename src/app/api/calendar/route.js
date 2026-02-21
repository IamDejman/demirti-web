import { NextResponse } from 'next/server';
import '@/lib/env-db';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';
import { getCohortIdsForUser } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const cohortIds = await getCohortIdsForUser(user.id, user.role);

    const [liveRes, assignRes, officeRes] = await Promise.all([
      cohortIds.length > 0
        ? sql`
            SELECT lc.id, lc.scheduled_at, lc.google_meet_link, w.title AS week_title, c.name AS cohort_name
            FROM live_classes lc
            JOIN weeks w ON w.id = lc.week_id
            JOIN cohorts c ON c.id = lc.cohort_id
            WHERE lc.cohort_id = ANY(${cohortIds});
          `
        : Promise.resolve({ rows: [] }),
      cohortIds.length > 0
        ? sql`
            SELECT a.id, a.deadline_at, a.title, c.name AS cohort_name
            FROM assignments a
            JOIN cohorts c ON c.id = a.cohort_id
            WHERE a.cohort_id = ANY(${cohortIds});
          `
        : Promise.resolve({ rows: [] }),
      user.role === 'facilitator'
        ? sql`
            SELECT s.id, s.start_time, s.end_time, s.title, s.meeting_link, s.cohort_id, c.name AS cohort_name
            FROM office_hour_slots s
            LEFT JOIN cohorts c ON c.id = s.cohort_id
            WHERE s.facilitator_id = ${user.id} AND s.is_cancelled = false;
          `
        : sql`
            SELECT s.id, s.start_time, s.end_time, s.title, s.meeting_link, s.cohort_id, c.name AS cohort_name
            FROM office_hour_bookings b
            JOIN office_hour_slots s ON s.id = b.slot_id
            LEFT JOIN cohorts c ON c.id = s.cohort_id
            WHERE b.student_id = ${user.id} AND b.status = 'booked' AND s.is_cancelled = false;
          `,
    ]);

    const events = [
      ...liveRes.rows.map((lc) => ({
        id: `live-${lc.id}`,
        type: 'live_class',
        title: `Live class: ${lc.week_title}`,
        start: lc.scheduled_at,
        end: lc.scheduled_at,
        url: lc.google_meet_link,
        meta: { cohort: lc.cohort_name },
      })),
      ...assignRes.rows.map((a) => ({
        id: `assignment-${a.id}`,
        type: 'assignment',
        title: `Assignment due: ${a.title}`,
        start: a.deadline_at,
        end: a.deadline_at,
        url: null,
        meta: { cohort: a.cohort_name },
      })),
      ...officeRes.rows.map((s) => ({
        id: `office-${s.id}`,
        type: 'office_hours',
        title: `Office hours${s.title ? `: ${s.title}` : ''}`,
        start: s.start_time,
        end: s.end_time || s.start_time,
        url: s.meeting_link,
        meta: { cohort: s.cohort_name || null },
      })),
    ].sort((a, b) => new Date(a.start) - new Date(b.start));

    return NextResponse.json({ events });
  } catch (e) {
    reportError(e, { route: 'GET /api/calendar' });
    const message = process.env.NODE_ENV === 'development' ? (e?.message || String(e)) : 'Failed to fetch calendar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
