import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { updateApplicationPayment, saveApplication, incrementScholarshipCount } from '@/lib/db';
import { sendPaymentConfirmationEmail } from '@/lib/paymentEmails';
import { enrollPaidApplicant } from '@/lib/lms-enrollment';

async function maybeEnroll({ email, firstName, lastName, trackName, applicationId }) {
  try {
    const result = await enrollPaidApplicant({ email, firstName, lastName, trackName, applicationId });
    if (!result.enrolled) {
      console.log('Enrollment skipped:', result.reason);
    }
  } catch (e) {
    console.error('Enrollment error:', e);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const checkOnly = searchParams.get('check_only') === 'true';

    if (!reference) {
      if (checkOnly) {
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
      }
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-failed?error=missing_reference`);
    }

    // Validate and trim Paystack secret key
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY is not configured in payment callback');
      if (checkOnly) {
        return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
      }
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-failed?error=service_not_configured`);
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
      console.error('Paystack verification error:', {
        status: response.status,
        reference,
        data: data
      });
    }

    if (checkOnly) {
      // Return JSON for polling
      if (data.status && data.data && data.data.status === 'success') {
        return NextResponse.json({ status: 'success', reference });
      } else {
        return NextResponse.json({ status: 'pending', reference });
      }
    }

    // For redirects (callback from Paystack popup)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (data.status && data.data && data.data.status === 'success') {
      // Payment successful - update application status in database
      const paymentData = data.data;
      const customer = paymentData.customer;
      const amount = paymentData.amount;
      const metadata = paymentData.metadata || {};
      const customFields = metadata.custom_fields || [];
      
      const email = customer?.email || '';
      const trackName = customFields.find(f => f.variable_name === 'track')?.value || 
                       metadata.track || '';
      
      console.log('Payment verification successful:', {
        reference,
        email,
        trackName,
        amount,
        hasMetadata: !!metadata,
        customFieldsCount: customFields.length
      });
      
      // Update application status if we have email and track
      if (email && trackName) {
        try {
          // Get application details for email
          const appResult = await sql`
            SELECT application_id, first_name, last_name FROM applications
            WHERE email = ${email} AND track_name = ${trackName}
            LIMIT 1;
          `;
          
          const appData = appResult.rows[0];
          const firstName = appData?.first_name || customFields.find(f => f.variable_name === 'first_name')?.value || '';
          const lastName = appData?.last_name || customFields.find(f => f.variable_name === 'last_name')?.value || '';
          
          const updated = await updateApplicationPayment(email, trackName, reference, amount);
          
          if (updated) {
            console.log('Application status updated to paid via GET callback');
            
            // Increment scholarship count
            try {
              await incrementScholarshipCount(trackName);
              console.log(`Scholarship count incremented for track: ${trackName}`);
            } catch (error) {
              console.error('Error updating scholarship count:', error);
            }
            
            // Send confirmation email to user (names optional)
            await sendPaymentConfirmationEmail({
              email,
              firstName,
              lastName,
              trackName,
              reference,
              amount
            });
            await maybeEnroll({ email, firstName, lastName, trackName, applicationId: appData?.application_id });
          } else {
            // If updateApplicationPayment returned null, try to find and update by reference
            console.log('No application found by email/track, trying to update by reference...');
            const result = await sql`
              UPDATE applications
              SET 
                payment_reference = ${reference},
                amount = ${amount},
                status = 'paid',
                paid_at = CURRENT_TIMESTAMP
              WHERE payment_reference IS NULL
                AND email = ${email}
                AND track_name = ${trackName}
              RETURNING *;
            `;
            
            if (result.rows.length > 0) {
              console.log('Application updated by reference');
              // Increment scholarship count
              try {
                await incrementScholarshipCount(trackName);
                console.log(`Scholarship count incremented for track: ${trackName}`);
              } catch (error) {
                console.error('Error updating scholarship count:', error);
              }
              const updatedApp = result.rows[0];
              await maybeEnroll({
                email: updatedApp.email,
                firstName: updatedApp.first_name,
                lastName: updatedApp.last_name,
                trackName: updatedApp.track_name || trackName,
                applicationId: updatedApp.application_id,
              });
            } else {
              // Last resort: try to update any application with this email and track, regardless of payment_reference
              console.log('Trying to update any application with this email and track...');
              const fallbackResult = await sql`
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
              
              if (fallbackResult.rows.length > 0) {
                console.log('Application updated via fallback query');
                // Increment scholarship count
                try {
                  await incrementScholarshipCount(trackName);
                  console.log(`Scholarship count incremented for track: ${trackName}`);
                } catch (error) {
                  console.error('Error updating scholarship count:', error);
                }
                const updatedApp = fallbackResult.rows[0];
                await maybeEnroll({
                  email: updatedApp.email,
                  firstName: updatedApp.first_name,
                  lastName: updatedApp.last_name,
                  trackName: updatedApp.track_name || trackName,
                  applicationId: updatedApp.application_id,
                });
              } else {
                console.log('No pending application found to update');
              }
            }
          }
        } catch (error) {
          console.error('Error updating application status:', error);
          // Continue even if update fails - webhook will handle it
        }
      } else {
        console.log('Missing email or trackName in payment callback:', { 
          email, 
          trackName, 
          hasCustomer: !!customer,
          hasMetadata: !!metadata,
          metadataKeys: metadata ? Object.keys(metadata) : []
        });
        
        // Try to find application by payment reference as last resort
        if (reference) {
          try {
            const refResult = await sql`
              SELECT * FROM applications
              WHERE payment_reference = ${reference}
              LIMIT 1;
            `;
            
            if (refResult.rows.length > 0) {
              console.log('Found application by payment reference, but already has reference set');
            } else {
              // Try to find any pending application and update it
              const pendingResult = await sql`
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
              
              if (pendingResult.rows.length > 0) {
                const updatedApp = pendingResult.rows[0];
                console.log('Updated most recent pending application:', updatedApp);
                
                // Try to increment scholarship count if we have track name
                if (updatedApp.track_name) {
                  try {
                    await incrementScholarshipCount(updatedApp.track_name);
                    console.log(`Scholarship count incremented for track: ${updatedApp.track_name}`);
                  } catch (error) {
                    console.error('Error updating scholarship count:', error);
                  }
                }
                await maybeEnroll({
                  email: updatedApp.email,
                  firstName: updatedApp.first_name,
                  lastName: updatedApp.last_name,
                  trackName: updatedApp.track_name,
                  applicationId: updatedApp.application_id,
                });
              }
            }
          } catch (error) {
            console.error('Error in fallback update by reference:', error);
          }
        }
      }
      
      // Payment successful - close popup and redirect parent window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
          </head>
          <body>
            <script>
              // Close popup and redirect parent window
              if (window.opener) {
                window.opener.location.href = '${baseUrl}/payment-success?reference=${reference}';
                window.close();
              } else {
                window.location.href = '${baseUrl}/payment-success?reference=${reference}';
              }
            </script>
            <p>Payment successful! Redirecting...</p>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      // Payment failed - close popup and redirect parent window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Failed</title>
          </head>
          <body>
            <script>
              // Close popup and redirect parent window
              if (window.opener) {
                window.opener.location.href = '${baseUrl}/payment-failed?error=payment_failed';
                window.close();
              } else {
                window.location.href = '${baseUrl}/payment-failed?error=payment_failed';
              }
            </script>
            <p>Payment failed! Redirecting...</p>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Error</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = '${baseUrl}/payment-failed?error=callback_error';
              window.close();
            } else {
              window.location.href = '${baseUrl}/payment-failed?error=callback_error';
            }
          </script>
          <p>An error occurred! Redirecting...</p>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// Handle Paystack webhook for payment verification
export async function POST(request) {
  try {
    const body = await request.text();
    const hash = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY is not configured in webhook');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }
    const expectedHash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    if (hash !== expectedHash) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    if (event.event === 'charge.success') {
      const { reference, customer, amount, metadata } = event.data;
      
      const customFields = metadata?.custom_fields || [];
      const firstName = customFields.find(f => f.variable_name === 'first_name')?.value || '';
      const lastName = customFields.find(f => f.variable_name === 'last_name')?.value || '';
      const phone = customFields.find(f => f.variable_name === 'phone')?.value || '';
      const trackName = customFields.find(f => f.variable_name === 'track')?.value || '';
      
      console.log('Payment successful:', {
        reference,
        customer: customer.email,
        amount: amount / 100, // Convert from kobo to naira
        track: trackName,
      });

      // Update or create application with payment details
      let savedApplication = null;
      try {
        if (!customer?.email || !trackName) {
          console.error('Webhook: Missing email or trackName:', { 
            email: customer?.email, 
            trackName,
            hasCustomer: !!customer,
            hasMetadata: !!metadata
          });
        } else {
          // Try to update existing pending application
          savedApplication = await updateApplicationPayment(
            customer.email,
            trackName,
            reference,
            amount
          );

          console.log('Webhook: updateApplicationPayment result:', {
            found: !!savedApplication,
            email: customer.email,
            trackName
          });

          // If no existing application found, create a new one
          if (!savedApplication) {
            console.log('Webhook: No existing application found, creating new one');
            savedApplication = await saveApplication({
              firstName,
              lastName,
              email: customer.email,
              phone,
              trackName,
              paymentOption: 'paystack',
              paymentReference: reference,
              amount: amount,
            });
          }

          console.log('Webhook: Application saved with payment details:', {
            id: savedApplication?.id,
            status: savedApplication?.status
          });
        }

        // Admin payment email has been migrated to Resend in /api/save-application,
        // so we don't send a separate Brevo email here anymore.

        // Send payment confirmation email to user (names optional)
        if (customer?.email && trackName) {
          await sendPaymentConfirmationEmail({
            email: customer.email,
            firstName,
            lastName,
            trackName,
            reference,
            amount
          });
        }
      } catch (error) {
        console.error('Error saving application with payment:', error);
      }

      // Increment scholarship count for this specific track if payment is successful
      try {
        if (trackName) {
          await incrementScholarshipCount(trackName);
          console.log(`Scholarship count incremented for track: ${trackName}`);
        }
      } catch (error) {
        console.error('Error updating scholarship count:', error);
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
