import { NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { endpoint } = body || {};
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
    }
    await deletePushSubscription(user.id, endpoint);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/push/unsubscribe:', e);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
