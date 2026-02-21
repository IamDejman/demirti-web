import { NextResponse } from 'next/server';
import { getAllAdmins, createAdmin, updateAdmin, disableAdmin, enableAdmin } from '@/lib/admin';
import { reportError } from '@/lib/logger';
import { validatePassword } from '@/lib/passwordPolicy';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const [, authError] = await requireAdmin(request);
    if (authError) return authError;

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
    reportError(error, { route: 'GET /api/admin/admins' });
    return NextResponse.json(
      { error: 'Failed to get admins' },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request) {
  try {
    const [, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pw = validatePassword(password);
    if (!pw.valid) {
      return NextResponse.json({ error: pw.message }, { status: 400 });
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
    reportError(error, { route: 'POST /api/admin/admins' });
    return NextResponse.json(
      { error: error.message || 'Failed to create admin' },
      { status: 400 }
    );
  }
}

// PUT - Update admin
export async function PUT(request) {
  try {
    const [, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { id, email, password, firstName, lastName, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const updates = {};
    if (email !== undefined) updates.email = email;
    if (password !== undefined) updates.password = password;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (isActive !== undefined) updates.isActive = isActive;

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
    reportError(error, { route: 'PUT /api/admin/admins' });
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

// PATCH - Disable/Enable admin
export async function PATCH(request) {
  try {
    const [, authError] = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { id, action } = body;

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
    reportError(error, { route: 'PATCH /api/admin/admins' });
    return NextResponse.json(
      { error: 'Failed to update admin status' },
      { status: 500 }
    );
  }
}

