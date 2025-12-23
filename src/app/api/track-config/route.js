import { NextResponse } from 'next/server';
import { getTrackConfig, getAllTracks, updateTrackConfig } from '@/lib/db';

// GET - Get track configuration
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
    console.error('Error getting track config:', error);
    return NextResponse.json(
      { error: 'Failed to get track configuration', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update track configuration
export async function PUT(request) {
  try {
    const body = await request.json();
    const { trackName, ...updates } = body;
    
    if (!trackName) {
      return NextResponse.json(
        { error: 'Track name is required' },
        { status: 400 }
      );
    }
    
    const updated = await updateTrackConfig(trackName, updates);
    
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
    console.error('Error updating track config:', error);
    return NextResponse.json(
      { error: 'Failed to update track configuration', details: error.message },
      { status: 500 }
    );
  }
}

