import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { incrementScholarshipCount } from '@/lib/db';

// POST - Manually verify and update payment status
export async function POST(request) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status || !data.data || data.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment not successful', status: data.data?.status },
        { status: 400 }
      );
    }

    const paymentData = data.data;
    const customer = paymentData.customer;
    const amount = paymentData.amount;
    const metadata = paymentData.metadata || {};
    const customFields = metadata.custom_fields || [];

    const email = customer?.email || '';
    const trackName = customFields.find(f => f.variable_name === 'track')?.value || 
                     metadata.track || '';

    console.log('Manual verification:', {
      reference,
      email,
      trackName,
      amount,
      hasMetadata: !!metadata
    });

    // Try multiple strategies to update the application
    let updated = false;
    let updatedApplication = null;

    // Strategy 1: Update by email and track (if we have both)
    if (email && trackName) {
      const result1 = await sql`
        UPDATE applications
        SET 
          payment_reference = ${reference},
          amount = ${amount},
          status = 'paid',
          paid_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
          AND track_name = ${trackName}
          AND status = 'pending'
        RETURNING *;
      `;

      if (result1.rows.length > 0) {
        updated = true;
        updatedApplication = result1.rows[0];
        console.log('Updated by email and track:', {
          id: updatedApplication.id,
          status: updatedApplication.status,
          email: updatedApplication.email,
          track: updatedApplication.track_name
        });
      } else {
        console.log('No application found to update by email and track:', { email, trackName });
      }
    }

    // Strategy 2: Update by payment reference (if already set but status is pending)
    if (!updated) {
      const result2 = await sql`
        UPDATE applications
        SET 
          amount = ${amount},
          status = 'paid',
          paid_at = CURRENT_TIMESTAMP
        WHERE payment_reference = ${reference}
          AND status = 'pending'
        RETURNING *;
      `;

      if (result2.rows.length > 0) {
        updated = true;
        updatedApplication = result2.rows[0];
        console.log('Updated by payment reference');
      }
    }

    // Strategy 3: Update most recent pending application (last resort)
    if (!updated) {
      const result3 = await sql`
        UPDATE applications
        SET 
          payment_reference = ${reference},
          amount = ${amount},
          status = 'paid',
          paid_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id FROM applications
          WHERE status = 'pending'
          ORDER BY created_at DESC
          LIMIT 1
        )
        RETURNING *;
      `;

      if (result3.rows.length > 0) {
        updated = true;
        updatedApplication = result3.rows[0];
        console.log('Updated most recent pending application');
      }
    }

    // Increment scholarship count if update was successful
    if (updated && updatedApplication) {
      console.log('Processing successful update:', {
        updated,
        hasApplication: !!updatedApplication,
        applicationId: updatedApplication?.id,
        status: updatedApplication?.status
      });
      
      const appTrackName = updatedApplication.track_name || trackName;
      if (appTrackName) {
        try {
          await incrementScholarshipCount(appTrackName);
          console.log(`Scholarship count incremented for track: ${appTrackName}`);
        } catch (error) {
          console.error('Error updating scholarship count:', error);
          // Don't fail the request if scholarship increment fails
        }
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Payment verified',
        application: updatedApplication
      }, { status: 200 });
    }

    // Check if application already exists and is already paid
    if (!updated) {
      // Check if application already exists and is already paid
      let existingApp = null;
      if (email && trackName) {
        const existingResult = await sql`
          SELECT * FROM applications
          WHERE email = ${email}
            AND track_name = ${trackName}
            AND (payment_reference = ${reference} OR payment_reference IS NULL)
          ORDER BY created_at DESC
          LIMIT 1;
        `;
        if (existingResult.rows.length > 0) {
          existingApp = existingResult.rows[0];
          if (existingApp.status === 'paid') {
            // Application already paid - return success (likely updated by webhook)
            console.log('Application already paid, returning success');
            return NextResponse.json({
              success: true,
              message: 'Payment already verified',
              application: existingApp
            });
          }
        }
      }

      // No pending application found
      console.log('No pending application found to update:', {
        updated,
        hasUpdatedApplication: !!updatedApplication,
        email,
        trackName,
        reference,
        existingAppStatus: existingApp?.status
      });
      
      return NextResponse.json(
        { 
          error: 'No pending application found to update',
          reference,
          email,
          trackName
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
}

