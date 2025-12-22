import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, trackName, amount, paymentOption } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !trackName || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate Paystack secret key
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key is not configured' },
        { status: 500 }
      );
    }

    // Prepare Paystack transaction data
    const paystackData = {
      email: email,
      amount: amount, // Amount in kobo (smallest currency unit)
      currency: 'NGN',
      reference: `CVERSE_${trackName.replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment-callback`,
      metadata: {
        custom_fields: [
          {
            display_name: 'First Name',
            variable_name: 'first_name',
            value: firstName
          },
          {
            display_name: 'Last Name',
            variable_name: 'last_name',
            value: lastName
          },
          {
            display_name: 'Phone Number',
            variable_name: 'phone',
            value: phone
          },
          {
            display_name: 'Track',
            variable_name: 'track',
            value: trackName
          }
        ]
      }
    };

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to initialize payment' },
        { status: response.status }
      );
    }

    if (data.status && data.data) {
      return NextResponse.json({
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      });
    }

    return NextResponse.json(
      { error: 'Unexpected response from Paystack' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'An error occurred while initializing payment' },
      { status: 500 }
    );
  }
}

