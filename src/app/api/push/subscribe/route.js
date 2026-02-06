import { NextResponse } from 'next/server';
import { upsertPushSubscription } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { endpoint, keys } = body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    await upsertPushSubscription(user.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/push/subscribe:', e);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
