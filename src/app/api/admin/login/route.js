import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getClientIp } from '@/lib/api-helpers';
import { reportError } from '@/lib/logger';
import { verifyAdminCredentials, createAdminSession } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';
import { recordAuditLog } from '@/lib/audit';

// POST - Admin login
export async function POST(request) {
  try {
    const ip = getClientIp(request);
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
        const ipAddress = getClientIp(request);
        try {
          await recordAuditLog({
            userId: null,
            action: 'admin.login',
            targetType: 'admin',
            targetId: String(admin.id),
            details: {},
            ipAddress,
            actorEmail: admin.email,
          });
        } catch (auditErr) {
          reportError(auditErr, { route: 'POST /api/admin/login' });
        }
        const res = NextResponse.json({
          success: true,
          admin: {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName
          },
          message: 'Login successful'
        });
        res.cookies.set('admin_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your credentials and try again.' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      reportError(dbError, { route: 'POST /api/admin/login' });
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
    reportError(error, { route: 'POST /api/admin/login' });
    
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
