import { NextResponse } from 'next/server';
import { aggregateDailyStatsForDateSimple, deleteEventsOlderThan } from '@/lib/db';

export const maxDuration = 60;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    await aggregateDailyStatsForDateSimple(yesterday);
    const deleted = await deleteEventsOlderThan(365);

    return NextResponse.json({
      success: true,
      aggregated: yesterday.toISOString().slice(0, 10),
      eventsDeleted: deleted,
    });
  } catch (error) {
    console.error('Analytics cron error:', error);
    return NextResponse.json(
      { error: 'Cron failed', details: error.message },
      { status: 500 }
    );
  }
}
