import { NextResponse } from 'next/server';
import { getScholarshipCount, incrementScholarshipCount } from '@/lib/db';

const SCHOLARSHIP_LIMIT = 10;

// GET - Check scholarship availability
export async function GET() {
  try {
    const { count } = await getScholarshipCount();
    const available = count < SCHOLARSHIP_LIMIT;
    const remaining = Math.max(0, SCHOLARSHIP_LIMIT - count);
    
    return NextResponse.json({
      available,
      count,
      limit: SCHOLARSHIP_LIMIT,
      remaining
    });
  } catch (error) {
    console.error('Error checking scholarship status:', error);
    return NextResponse.json(
      { error: 'Failed to check scholarship status', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Increment scholarship count (called after successful payment)
export async function POST() {
  try {
    const { count } = await getScholarshipCount();
    
    if (count >= SCHOLARSHIP_LIMIT) {
      return NextResponse.json(
        { error: 'Scholarship limit reached' },
        { status: 400 }
      );
    }
    
    const newCount = await incrementScholarshipCount();
    
    return NextResponse.json({
      success: true,
      count: newCount,
      remaining: SCHOLARSHIP_LIMIT - newCount
    });
  } catch (error) {
    console.error('Error incrementing scholarship count:', error);
    return NextResponse.json(
      { error: 'Failed to update scholarship count', details: error.message },
      { status: 500 }
    );
  }
}
