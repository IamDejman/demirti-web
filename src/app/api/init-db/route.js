import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { ensureLmsSchema } from '@/lib/db-lms';
import { sql } from '@vercel/postgres';
import { logger } from '@/lib/logger';
import { getAdminFromRequest } from '@/lib/adminAuth';

if (!process.env.POSTGRES_URL?.trim() && process.env.NEW_POSTGRES_URL?.trim()) {
  process.env.POSTGRES_URL = process.env.NEW_POSTGRES_URL;
}

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized – admin authentication required' }, { status: 401 });
  }
  try {
    // First, check database connection
    try {
      await sql`SELECT 1 as test`;
      logger.info('Database connection successful');
    } catch (connError) {
      logger.error('Database connection error', { hint: connError?.message });
      return NextResponse.json(
        {
          error: 'Database connection failed',
          hint: 'Set POSTGRES_URL or NEW_POSTGRES_URL in your environment (e.g. Vercel env vars).'
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
    
    logger.info('Existing tables', { tables: tablesCheck.rows.map(r => r.table_name) });

    // Initialize database
    await initializeDatabase();
    // Ensure LMS schema (users, cohorts, weeks, assignments, etc.)
    let lmsOk = false;
    let lmsError = null;
    try {
      await ensureLmsSchema();
      lmsOk = true;
    } catch (lmsErr) {
      logger.warn('LMS schema init skipped or failed', { message: lmsErr.message });
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
      AND table_name IN (
        'users', 'user_sessions', 'user_social_links',
        'cohorts', 'cohort_facilitators', 'cohort_students',
        'weeks', 'weekly_checklist_items', 'student_checklist_progress',
        'content_items', 'materials', 'assignments', 'assignment_submissions',
        'live_classes', 'attendance_records', 'announcements', 'notifications',
        'notification_preferences', 'chat_rooms', 'chat_room_members', 'chat_messages',
        'message_reports', 'jobs', 'industry_professionals', 'sample_projects',
        'portfolios', 'portfolio_projects', 'portfolio_social_links', 'certificates',
        'ai_conversations', 'ai_messages', 'ai_usage_limits', 'push_subscriptions',
        'audit_logs', 'admin_impersonations', 'course_templates', 'notification_templates',
        'lms_events', 'office_hour_slots', 'office_hour_bookings', 'job_applications', 'ai_settings',
        'moderation_actions'
      )
      ORDER BY table_name;
    `;
    const lmsTablesPresent = lmsCheck.rows.map((r) => r.table_name);

    logger.info('Tables after initialization', { tables: tablesAfter.rows.map(r => r.table_name) });
    logger.info('LMS tables present', { tables: lmsTablesPresent });

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
    logger.error('Database initialization error', { message: error?.message });
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
