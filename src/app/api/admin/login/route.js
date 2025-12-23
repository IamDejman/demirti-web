import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyAdminCredentials } from '@/lib/admin';

// POST - Admin login
export async function POST(request) {
  try {
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
      console.log('Login attempt for email:', normalizedEmail);
      const admin = await verifyAdminCredentials(normalizedEmail, password);

      if (admin) {
        console.log('Login successful for admin ID:', admin.id);
        // Generate a simple token (in production, use JWT or a more secure method)
        const token = crypto.randomBytes(32).toString('hex');
        
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
        console.log('Login failed: Invalid credentials for email:', normalizedEmail);
        return NextResponse.json(
          { error: 'Invalid email or password. Please check your credentials and try again.' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.error('Database error during login:', dbError);
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
    console.error('Login error:', error);
    
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

