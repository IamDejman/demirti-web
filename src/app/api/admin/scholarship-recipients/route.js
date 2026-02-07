import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAllTracks } from '@/lib/db';

// GET - Get scholarship recipients (people who received scholarships)
export async function GET() {
  try {
    // Get all tracks with their scholarship limits
    const tracks = await getAllTracks();
    
    // Get scholarship recipients for each track
    const recipientsData = await Promise.all(
      tracks.map(async (track) => {
        const limit = track.scholarship_limit;
        
        // Get the first N paid applications for this track (ordered by paid_at)
        // These are the scholarship recipients
        const recipientsResult = await sql`
          SELECT 
            id,
            first_name,
            last_name,
            email,
            phone,
            track_name,
            payment_reference,
            amount,
            paid_at,
            created_at
          FROM applications
          WHERE track_name = ${track.track_name}
            AND status = 'paid'
            AND paid_at IS NOT NULL
          ORDER BY paid_at ASC
          LIMIT ${limit};
        `;
        
        const recipients = recipientsResult.rows.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          trackName: row.track_name,
          paymentReference: row.payment_reference,
          amount: row.amount,
          paidAt: row.paid_at,
          createdAt: row.created_at
        }));
        
        return {
          trackName: track.track_name,
          scholarshipLimit: limit,
          discountPercentage: track.scholarship_discount_percentage,
          recipients
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      recipientsByTrack: recipientsData
    });
  } catch (error) {
    console.error('Error getting scholarship recipients:', error);
    return NextResponse.json(
      { error: 'Failed to get scholarship recipients', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500 }
    );
  }
}

