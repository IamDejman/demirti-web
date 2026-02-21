import { NextResponse } from 'next/server';
import { getDiscountByName } from '@/lib/db';
import { reportError } from '@/lib/logger';

// GET - Validate a discount code by name
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    const discount = await getDiscountByName(code.trim());

    if (!discount) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid or inactive discount code'
      });
    }

    return NextResponse.json({
      valid: true,
      discount: {
        name: discount.name,
        percentage: parseFloat(discount.percentage)
      }
    });
  } catch (error) {
    reportError(error, { route: 'GET /api/validate-discount' });
    return NextResponse.json({ error: 'Failed to validate discount' }, { status: 500 });
  }
}

