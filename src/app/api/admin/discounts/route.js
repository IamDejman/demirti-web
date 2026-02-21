import { NextResponse } from 'next/server';
import { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount } from '@/lib/db';
import { reportError } from '@/lib/logger';

// GET - Get all discounts
export async function GET() {
  try {
    const discounts = await getAllDiscounts();
    
    return NextResponse.json({
      success: true,
      discounts: discounts
    });
  } catch (error) {
    reportError(error, { route: 'GET /api/admin/discounts' });
    return NextResponse.json(
      { error: 'Failed to get discounts' },
      { status: 500 }
    );
  }
}

// POST - Create a new discount
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, percentage } = body;

    // Validate required fields
    if (!name || percentage === undefined || percentage === null) {
      return NextResponse.json(
        { error: 'Name and percentage are required' },
        { status: 400 }
      );
    }

    // Validate percentage range
    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const discount = await createDiscount(name, percentageNum);
    
    return NextResponse.json({
      success: true,
      discount: discount
    });
  } catch (error) {
    reportError(error, { route: 'POST /api/admin/discounts' });
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

// PUT - Update a discount
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, percentage, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    // Validate percentage if provided
    if (percentage !== undefined && percentage !== null) {
      const percentageNum = parseFloat(percentage);
      if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
        return NextResponse.json(
          { error: 'Percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (percentage !== undefined) updates.percentage = parseFloat(percentage);
    if (isActive !== undefined) updates.isActive = isActive;

    const discount = await updateDiscount(id, updates);
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      discount: discount
    });
  } catch (error) {
    reportError(error, { route: 'PUT /api/admin/discounts' });
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a discount
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 }
      );
    }

    const discount = await deleteDiscount(parseInt(id));
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    reportError(error, { route: 'DELETE /api/admin/discounts' });
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}

