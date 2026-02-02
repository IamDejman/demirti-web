import { NextResponse } from 'next/server';
import { getTracksLms, createTrackLms } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET() {
  try {
    const tracks = await getTracksLms(true);
    return NextResponse.json({ tracks });
  } catch (e) {
    console.error('GET /api/tracks:', e);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const {
      trackName,
      coursePrice,
      slug,
      description,
      durationWeeks,
      thumbnailUrl,
      scholarshipLimit,
      scholarshipDiscountPercentage,
    } = body;
    if (!trackName?.trim()) {
      return NextResponse.json({ error: 'Track name is required' }, { status: 400 });
    }
    const track = await createTrackLms({
      trackName: trackName.trim(),
      coursePrice: coursePrice ?? 0,
      slug: slug?.trim() || null,
      description: description?.trim() || null,
      durationWeeks: durationWeeks ?? 12,
      thumbnailUrl: thumbnailUrl?.trim() || null,
      scholarshipLimit: scholarshipLimit ?? 10,
      scholarshipDiscountPercentage: scholarshipDiscountPercentage ?? 50,
    });
    return NextResponse.json({ track });
  } catch (e) {
    if (e.code === '23505') {
      return NextResponse.json({ error: 'Track with this name or slug already exists' }, { status: 409 });
    }
    console.error('POST /api/tracks:', e);
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
  }
}
