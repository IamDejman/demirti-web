import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { updateApplicationPayment, saveApplication, incrementScholarshipCount, getApplicationByEmailAndTrack } from '@/lib/db';
import * as brevo from '@getbrevo/brevo';

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

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

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
    const secret = process.env.PAYSTACK_SECRET_KEY;
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

        // Send email notification
        try {
          if (process.env.BREVO_API_KEY) {
            const apiInstance = new brevo.TransactionalEmailsApi();
            apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
            
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            sendSmtpEmail.sender = {
              name: 'CVERSE Application System',
              email: process.env.BREVO_FROM_EMAIL || 'noreply@demirti.com'
            };
            sendSmtpEmail.to = [{ email: 'admin@demirti.com' }];
            sendSmtpEmail.subject = `PAID Application: ${trackName} - ${firstName} ${lastName}`;
            
            sendSmtpEmail.htmlContent = `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #00c896; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                      <h2 style="margin: 0;">Payment Received - Application Complete</h2>
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #e1e4e8;">
                      <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; background-color: #00c896; color: white; font-weight: 600; margin-bottom: 20px;">
                        PAID
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Track:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${trackName}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Name:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${firstName} ${lastName}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Email:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${customer.email}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Phone:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${phone}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Payment Reference:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${reference}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Amount:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">₦${(amount / 100).toLocaleString()}</div>
                      </div>
                      <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #666;">Payment Date:</div>
                        <div style="color: #1a1a1a; margin-top: 5px;">${new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `;
            
            await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Payment confirmation email sent to admin@demirti.com');
          }
        } catch (emailError) {
          console.error('Error sending payment email:', emailError);
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

