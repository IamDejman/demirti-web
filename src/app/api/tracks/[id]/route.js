import { NextResponse } from 'next/server';
import { getTrackByIdLms, updateTrackLms } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    const track = await getTrackByIdLms(id);
    if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    return NextResponse.json({ track });
  } catch (e) {
    console.error('GET /api/tracks/[id]:', e);
    return NextResponse.json({ error: 'Failed to fetch track' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    const body = await request.json();
    const track = await updateTrackLms(id, {
      slug: body.slug,
      description: body.description,
      durationWeeks: body.durationWeeks,
      thumbnailUrl: body.thumbnailUrl,
      trackName: body.trackName,
      isActive: body.isActive,
    });
    if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    return NextResponse.json({ track });
  } catch (e) {
    console.error('PUT /api/tracks/[id]:', e);
    return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
  }
}
