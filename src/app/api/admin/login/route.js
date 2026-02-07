import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAdminCredentials, createAdminSession } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';

// POST - Admin login
export async function POST(request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const limiter = await rateLimit(`admin_login_${ip}`, { windowMs: 60_000, limit: 8 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
    }
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    
    // Verify credentials against database
    try {
      const admin = await verifyAdminCredentials(normalizedEmail, password);

      if (admin) {
        const token = crypto.randomBytes(32).toString('hex');
        await createAdminSession(admin.id, token);
        return NextResponse.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName
          },
          message: 'Login successful'
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your credentials and try again.' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.error('Database error during login');
      // Check if it's a database connection error
      if (dbError.message && dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database not initialized. Please visit /api/init-db to initialize the database first.',
            details: 'The admins table does not exist. Run database initialization.'
          },
          { status: 500 }
        );
      }
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Login error');
    
    if (error.message === 'Admin account is disabled') {
      return NextResponse.json(
        { error: 'Your admin account has been disabled. Please contact the administrator.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
