import { NextResponse } from 'next/server';

// POST - Admin logout
export async function POST() {
  // Since we're using localStorage on the client side, 
  // this endpoint just confirms logout
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}

