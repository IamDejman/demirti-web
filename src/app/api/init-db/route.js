import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { ensureLmsSchema } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';

// Initialize database tables (run once)
export async function GET() {
  try {
    // First, check database connection
    try {
      await sql`SELECT 1 as test`;
      console.log('Database connection successful');
    } catch (connError) {
      console.error('Database connection error:', connError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: connError.message,
          hint: 'Please check your POSTGRES_URL environment variable'
        },
        { status: 500 }
      );
    }

    // Check if tables already exist
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tracks', 'applications', 'admins', 'admin_password_resets', 'scholarship_tracking', 'discounts', 'events')
      ORDER BY table_name;
    `;
    
    console.log('Existing tables:', tablesCheck.rows.map(r => r.table_name));

    // Initialize database
    await initializeDatabase();
    // Ensure LMS schema (users, cohorts, weeks, assignments, etc.)
    let lmsOk = false;
    let lmsError = null;
    try {
      await ensureLmsSchema();
      lmsOk = true;
    } catch (lmsErr) {
      console.warn('LMS schema init skipped or failed:', lmsErr.message);
      lmsError = lmsErr.message;
    }

    // Verify base tables
    const tablesAfter = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tracks', 'applications', 'admins', 'admin_password_resets', 'scholarship_tracking', 'discounts', 'events')
      ORDER BY table_name;
    `;

    // List LMS tables if they exist
    const lmsCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_sessions', 'user_social_links', 'cohorts', 'cohort_facilitators', 'cohort_students', 'weeks', 'weekly_checklist_items', 'student_checklist_progress', 'content_items', 'materials', 'assignments', 'assignment_submissions', 'live_classes', 'attendance_records')
      ORDER BY table_name;
    `;
    const lmsTablesPresent = lmsCheck.rows.map((r) => r.table_name);

    console.log('Tables after initialization:', tablesAfter.rows.map(r => r.table_name));
    console.log('LMS tables present:', lmsTablesPresent);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tablesCreated: tablesAfter.rows.map(r => r.table_name),
      tablesBefore: tablesCheck.rows.map(r => r.table_name),
      lmsSchema: lmsOk ? 'ensured' : 'failed',
      lmsError: lmsError || undefined,
      lmsTablesPresent: lmsTablesPresent.length > 0 ? lmsTablesPresent : undefined
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

