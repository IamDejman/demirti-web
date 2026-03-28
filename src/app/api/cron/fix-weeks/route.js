import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema } from '@/lib/db-lms';

export const dynamic = 'force-dynamic';

/**
 * One-time fix: Re-lock weeks that were incorrectly unlocked due to timezone bug.
 * Re-computes the correct week using SQL date math and re-locks anything beyond it.
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureLmsSchema();

    // Get active cohorts with correct week computed in SQL
    const cohortsResult = await sql`
      SELECT id, start_date, current_week,
             FLOOR((CURRENT_DATE - start_date::date) / 7) + 1 AS correct_week
      FROM cohorts
      WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
    `;

    const fixes = [];

    for (const cohort of cohortsResult.rows) {
      const correctWeek = Math.max(1, Number(cohort.correct_week));

      // Re-lock weeks beyond the correct week
      const relockResult = await sql`
        UPDATE weeks
        SET is_locked = true, updated_at = CURRENT_TIMESTAMP
        WHERE cohort_id = ${cohort.id}
          AND week_number > ${correctWeek}
          AND is_locked = false
        RETURNING id, week_number, title;
      `;

      // Fix cohort current_week
      if (cohort.current_week !== correctWeek) {
        await sql`
          UPDATE cohorts
          SET current_week = ${correctWeek}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${cohort.id};
        `;
      }

      fixes.push({
        cohort_id: cohort.id,
        start_date: cohort.start_date,
        was_on_week: cohort.current_week,
        correct_week: correctWeek,
        weeks_relocked: relockResult.rows.map((w) => `Week ${w.week_number}: ${w.title}`),
      });
    }

    return NextResponse.json({ success: true, fixes });
  } catch (error) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
