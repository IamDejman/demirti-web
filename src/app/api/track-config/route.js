import { NextResponse } from 'next/server';
import { getTrackConfig, getAllTracks, updateTrackConfig } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { reportError } from '@/lib/logger';
import { validateBody, trackConfigSchema } from '@/lib/schemas';

// GET - Get track configuration (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackName = searchParams.get('track');
    
    if (trackName) {
      // Get specific track config
      const track = await getTrackConfig(trackName);
      if (!track) {
        return NextResponse.json(
          { error: 'Track not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(track);
    } else {
      // Get all tracks
      const tracks = await getAllTracks();
      return NextResponse.json({ tracks });
    }
  } catch (error) {
    reportError(error, { route: 'GET /api/track-config' });
    return NextResponse.json(
      { error: 'Failed to get track configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update track configuration (admin only)
export async function PUT(request) {
  const [, authErr] = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const [data, validationErr] = await validateBody(request, trackConfigSchema);
    if (validationErr) return validationErr;
    const { trackName, coursePrice, scholarshipLimit, scholarshipDiscountPercentage, isActive } = data;
    const updates = { coursePrice, scholarshipLimit, scholarshipDiscountPercentage, isActive };
    
    const updated = await updateTrackConfig(trackName, Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ));
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Track not found or no updates provided' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      track: updated
    });
  } catch (error) {
    reportError(error, { route: 'PUT /api/track-config' });
    return NextResponse.json(
      { error: 'Failed to update track configuration' },
      { status: 500 }
    );
  }
}

