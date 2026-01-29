import { NextResponse } from 'next/server';
import { recordEvent } from '@/lib/db';

const MAX_BODY_BYTES = 32 * 1024; // 32KB

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    const body = JSON.parse(raw);

    const {
      type,
      name = null,
      sessionId = null,
      url = null,
      referrer = null,
      properties = null,
    } = body || {};

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event: type is required' },
        { status: 400 }
      );
    }

    // Normalize type
    const normalizedType = type.toLowerCase();

    // Only allow simple event structure
    const safeEvent = {
      type: normalizedType,
      name: typeof name === 'string' ? name : null,
      sessionId: typeof sessionId === 'string' ? sessionId : null,
      url: typeof url === 'string' ? url : null,
      referrer: typeof referrer === 'string' ? referrer : null,
      properties: properties && typeof properties === 'object' ? properties : null,
    };

    await recordEvent(safeEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

