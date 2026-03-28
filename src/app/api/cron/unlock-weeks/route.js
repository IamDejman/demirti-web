import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Cron: Auto-unlock weeks based on cohort start_date + week_number.
 *
 * Logic:
 *  1. For every ACTIVE cohort, compute which week we're in:
 *       currentWeekNum = floor((today - start_date) / 7) + 1
 *  2. Unlock all weeks where week_number <= currentWeekNum AND is_locked = true.
 *  3. Update cohort.current_week to currentWeekNum (capped at max week).
 *
 * Run daily (or hourly). Each invocation is idempotent.
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all active cohorts (start_date <= today <= end_date)
    const cohortsResult = await sql`
      SELECT id, start_date, end_date, current_week
      FROM cohorts
      WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
    `;
    const cohorts = cohortsResult.rows;

    let totalUnlocked = 0;
    let cohortsUpdated = 0;
    const details = [];

    for (const cohort of cohorts) {
      // 2. Compute which week number we should be on
      const startDate = new Date(cohort.start_date);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const computedWeek = Math.floor(daysSinceStart / 7) + 1;

      // 3. Get max week number for this cohort
      const maxWeekResult = await sql`
        SELECT MAX(week_number) AS max_week FROM weeks WHERE cohort_id = ${cohort.id};
      `;
      const maxWeek = maxWeekResult.rows[0]?.max_week || 12;
      const targetWeek = Math.min(computedWeek, maxWeek);

      if (targetWeek < 1) continue;

      // 4. Unlock all weeks up to targetWeek
      const unlockResult = await sql`
        UPDATE weeks
        SET is_locked = false, updated_at = CURRENT_TIMESTAMP
        WHERE cohort_id = ${cohort.id}
          AND week_number <= ${targetWeek}
          AND is_locked = true
        RETURNING id, week_number, title;
      `;
      totalUnlocked += unlockResult.rowCount;

      // 5. Update cohort current_week if it changed
      if (cohort.current_week !== targetWeek) {
        await sql`
          UPDATE cohorts
          SET current_week = ${targetWeek}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${cohort.id};
        `;
        cohortsUpdated++;
      }

      if (unlockResult.rowCount > 0 || cohort.current_week !== targetWeek) {
        details.push({
          cohort_id: cohort.id,
          computed_week: targetWeek,
          previous_week: cohort.current_week,
          weeks_unlocked: unlockResult.rows.map((w) => `Week ${w.week_number}: ${w.title}`),
        });
      }
    }

    return NextResponse.json({
      success: true,
      active_cohorts: cohorts.length,
      weeks_unlocked: totalUnlocked,
      cohorts_updated: cohortsUpdated,
      details,
    });
  } catch (error) {
    reportError(error, { route: 'GET /api/cron/unlock-weeks' });
    return NextResponse.json({ error: 'Failed to unlock weeks' }, { status: 500 });
  }
}
