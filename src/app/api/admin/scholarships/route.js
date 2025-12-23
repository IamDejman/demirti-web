import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAllTracks } from '@/lib/db';

// GET - Get scholarship status for all tracks
export async function GET() {
  try {
    // Get all tracks
    const tracks = await getAllTracks();
    
    // Get scholarship counts for each track
    const scholarshipData = await Promise.all(
      tracks.map(async (track) => {
        const countResult = await sql`
          SELECT count FROM scholarship_tracking
          WHERE track_name = ${track.track_name}
          LIMIT 1;
        `;
        
        const count = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count) || 0 : 0;
        const limit = track.scholarship_limit; // From database
        const remaining = Math.max(0, limit - count);
        const available = count < limit;
        
        return {
          trackName: track.track_name,
          count,
          limit,
          remaining,
          available,
          discountPercentage: track.scholarship_discount_percentage // From database
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      scholarships: scholarshipData
    });
  } catch (error) {
    console.error('Error getting scholarship data:', error);
    return NextResponse.json(
      { error: 'Failed to get scholarship data', details: error.message },
      { status: 500 }
    );
  }
}

