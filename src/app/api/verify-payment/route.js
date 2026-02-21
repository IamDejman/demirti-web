import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { logger, reportError } from '@/lib/logger';
import { incrementScholarshipCount } from '@/lib/db';
import { sendPaymentConfirmationEmail } from '@/lib/paymentEmails';
import { enrollPaidApplicant } from '@/lib/lms-enrollment';

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

    // Validate and trim Paystack secret key
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!paystackSecretKey) {
      reportError(new Error('PAYSTACK_SECRET_KEY is not configured'), { route: 'POST /api/verify-payment' });
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      reportError(new Error(data?.message || data?.error || 'Paystack verification failed'), {
        route: 'POST /api/verify-payment',
        status: response.status,
        reference,
      });
      return NextResponse.json(
        { 
          error: data.message || data.error || 'Failed to verify payment',
          details: data
        },
        { status: response.status }
      );
    }

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

    logger.info('Manual verification', { reference, email, trackName, amount, hasMetadata: !!metadata });

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
        logger.info('Updated by email and track', {
          id: updatedApplication.id,
          status: updatedApplication.status,
          email: updatedApplication.email,
          track: updatedApplication.track_name,
        });
      } else {
        logger.info('No application found to update by email and track', { email, trackName });
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
        logger.info('Updated by payment reference');
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
        logger.info('Updated most recent pending application');
      }
    }

    // Increment scholarship count and send confirmation email if update was successful
    if (updated && updatedApplication) {
      logger.info('Processing successful update', {
        updated,
        hasApplication: !!updatedApplication,
        applicationId: updatedApplication?.id,
        status: updatedApplication?.status,
      });
      
      const appTrackName = updatedApplication.track_name || trackName;
      if (appTrackName) {
        try {
          await incrementScholarshipCount(appTrackName);
          logger.info('Scholarship count incremented for track', { track: appTrackName });
        } catch (error) {
          reportError(error, { route: 'POST /api/verify-payment', context: 'scholarship count' });
          // Don't fail the request if scholarship increment fails
        }
      }

      // Send payment confirmation email to user via Resend
      try {
        await sendPaymentConfirmationEmail({
          email: updatedApplication.email,
          firstName: updatedApplication.first_name || '',
          lastName: updatedApplication.last_name || '',
          trackName: appTrackName,
          reference,
          amount,
        });
      } catch (emailError) {
        reportError(emailError, { route: 'POST /api/verify-payment', context: 'payment confirmation email' });
      }

      try {
        await enrollPaidApplicant({
          email: updatedApplication.email,
          firstName: updatedApplication.first_name || '',
          lastName: updatedApplication.last_name || '',
          trackName: appTrackName,
          applicationId: updatedApplication.application_id,
        });
      } catch (enrollError) {
        reportError(enrollError, { route: 'POST /api/verify-payment', context: 'enrollment' });
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
            logger.info('Application already paid, returning success');
            return NextResponse.json({
              success: true,
              message: 'Payment already verified',
              application: existingApp
            });
          }
        }
      }

      // No pending application found
      logger.info('No pending application found to update', {
        updated,
        hasUpdatedApplication: !!updatedApplication,
        email,
        trackName,
        reference,
        existingAppStatus: existingApp?.status,
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
    reportError(error, { route: 'POST /api/verify-payment' });
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
