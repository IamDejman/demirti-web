import { NextResponse } from 'next/server';
import { ensureLmsSchema } from '@/lib/db-lms';

/**
 * Initialize LMS schema (users, cohorts, weeks, assignments, etc.).
 * Safe to call multiple times; creates tables only if missing.
 */
export async function GET() {
  try {
    await ensureLmsSchema();
    return NextResponse.json({
      success: true,
      message: 'LMS schema initialized or already present',
    });
  } catch (error) {
    console.error('LMS init error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize LMS schema',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
