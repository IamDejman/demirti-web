import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCohortIdsForUser } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

function formatICSDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const cohortIds = await getCohortIdsForUser(user.id, user.role);

    const liveRes = cohortIds.length > 0
      ? await sql`
          SELECT lc.id, lc.scheduled_at, lc.google_meet_link, w.title AS week_title, c.name AS cohort_name
          FROM live_classes lc
          JOIN weeks w ON w.id = lc.week_id
          JOIN cohorts c ON c.id = lc.cohort_id
          WHERE lc.cohort_id = ANY(${cohortIds});
        `
      : { rows: [] };
    const assignRes = cohortIds.length > 0
      ? await sql`
          SELECT a.id, a.deadline_at, a.title, c.name AS cohort_name
          FROM assignments a
          JOIN cohorts c ON c.id = a.cohort_id
          WHERE a.cohort_id = ANY(${cohortIds});
        `
      : { rows: [] };

    const officeRes = user.role === 'facilitator'
      ? await sql`
          SELECT s.id, s.start_time, s.end_time, s.title, s.meeting_link, s.cohort_id, c.name AS cohort_name
          FROM office_hour_slots s
          LEFT JOIN cohorts c ON c.id = s.cohort_id
          WHERE s.facilitator_id = ${user.id} AND s.is_cancelled = false;
        `
      : await sql`
          SELECT s.id, s.start_time, s.end_time, s.title, s.meeting_link, s.cohort_id, c.name AS cohort_name
          FROM office_hour_bookings b
          JOIN office_hour_slots s ON s.id = b.slot_id
          LEFT JOIN cohorts c ON c.id = s.cohort_id
          WHERE b.student_id = ${user.id} AND b.status = 'booked' AND s.is_cancelled = false;
        `;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CVERSE Academy//LMS Calendar//EN',
    ];

    for (const lc of liveRes.rows) {
      const start = formatICSDate(lc.scheduled_at);
      const end = formatICSDate(new Date(new Date(lc.scheduled_at).getTime() + 60 * 60 * 1000));
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:live-${lc.id}@cverse`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
      lines.push(`SUMMARY:Live class: ${lc.week_title}`);
      lines.push(`DESCRIPTION:Cohort: ${lc.cohort_name}`);
      if (lc.google_meet_link) lines.push(`URL:${lc.google_meet_link}`);
      lines.push('END:VEVENT');
    }

    for (const a of assignRes.rows) {
      const start = formatICSDate(a.deadline_at);
      const end = formatICSDate(new Date(new Date(a.deadline_at).getTime() + 30 * 60 * 1000));
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:assignment-${a.id}@cverse`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
      lines.push(`SUMMARY:Assignment due: ${a.title}`);
      lines.push(`DESCRIPTION:Cohort: ${a.cohort_name}`);
      lines.push('END:VEVENT');
    }

    for (const s of officeRes.rows) {
      const start = formatICSDate(s.start_time);
      const endTime = s.end_time ? new Date(s.end_time) : new Date(new Date(s.start_time).getTime() + 30 * 60 * 1000);
      const end = formatICSDate(endTime);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:office-${s.id}@cverse`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
      lines.push(`SUMMARY:Office hours${s.title ? `: ${s.title}` : ''}`);
      if (s.cohort_name) lines.push(`DESCRIPTION:Cohort: ${s.cohort_name}`);
      if (s.meeting_link) lines.push(`URL:${s.meeting_link}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cverse-calendar.ics"',
      },
    });
  } catch (e) {
    console.error('GET /api/calendar/ics:', e);
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
  }
}
