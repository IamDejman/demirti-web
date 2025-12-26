import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
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
      AND table_name IN ('tracks', 'applications', 'admins', 'scholarship_tracking', 'discounts')
      ORDER BY table_name;
    `;
    
    console.log('Existing tables:', tablesCheck.rows.map(r => r.table_name));

    // Initialize database
    await initializeDatabase();
    
    // Verify tables were created
    const tablesAfter = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tracks', 'applications', 'admins', 'scholarship_tracking', 'discounts')
      ORDER BY table_name;
    `;
    
    console.log('Tables after initialization:', tablesAfter.rows.map(r => r.table_name));

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tablesCreated: tablesAfter.rows.map(r => r.table_name),
      tablesBefore: tablesCheck.rows.map(r => r.table_name)
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

