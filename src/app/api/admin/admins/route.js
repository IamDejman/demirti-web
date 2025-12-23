import { NextResponse } from 'next/server';
import { getAllAdmins, createAdmin, updateAdmin, disableAdmin, enableAdmin } from '@/lib/admin';

// GET - Get all admins
export async function GET() {
  try {
    const admins = await getAllAdmins();
    
    // Remove password hashes from response
    const safeAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      firstName: admin.first_name,
      lastName: admin.last_name,
      isActive: admin.is_active,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
      lastLogin: admin.last_login
    }));
    
    return NextResponse.json({
      success: true,
      admins: safeAdmins
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    return NextResponse.json(
      { error: 'Failed to get admins', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const admin = await createAdmin({ email, password, firstName, lastName });
    
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        isActive: admin.is_active,
        createdAt: admin.created_at
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin', details: error.message },
      { status: 400 }
    );
  }
}

// PUT - Update admin
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateAdmin(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Admin not found or no updates provided' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      admin: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        isActive: updated.is_active,
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Disable/Enable admin
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'disable' or 'enable'

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Admin ID and action are required' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'disable') {
      result = await disableAdmin(id);
    } else if (action === 'enable') {
      result = await enableAdmin(id);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "disable" or "enable"' },
        { status: 400 }
      );
    }
    
    if (!result) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      admin: {
        id: result.id,
        email: result.email,
        isActive: result.is_active
      }
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return NextResponse.json(
      { error: 'Failed to update admin status', details: error.message },
      { status: 500 }
    );
  }
}

