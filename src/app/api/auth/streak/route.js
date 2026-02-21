import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromRequest } from '@/lib/auth';
import { ensureLmsSchema } from '@/lib/db-lms';

function parseISODate(str) {
  const m = str?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

function datesAreConsecutive(d1, d2) {
  const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

function calculateStreaks(dates) {
  if (!dates || dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedDates = [...new Set(dates)]
    .map(parseISODate)
    .filter(Boolean)
    .map((d) => {
      d.setHours(0, 0, 0, 0);
      return d;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  const dateSet = new Set(sortedDates.map((d) => d.getTime()));

  let currentStreak = 0;
  let checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);

  if (dateSet.has(checkDate.getTime())) {
    currentStreak = 1;
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    while (dateSet.has(yesterday.getTime())) {
      currentStreak++;
      yesterday.setDate(yesterday.getDate() - 1);
    }
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    if (datesAreConsecutive(sortedDates[i - 1], sortedDates[i])) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak };
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureLmsSchema();

    const result = await sql`
      SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC')::text AS activity_date
      FROM lms_events
      WHERE user_id = ${user.id}
    `;

    const dates = result.rows.map((r) => r.activity_date);
    const { currentStreak, longestStreak } = calculateStreaks(dates);

    return NextResponse.json({ currentStreak, longestStreak });
  } catch (e) {
    console.error('Streak API error:', e);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}
