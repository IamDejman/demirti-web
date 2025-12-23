import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';
import { updateApplicationPayment, saveApplication, incrementScholarshipCount } from '@/lib/db';
import * as brevo from '@getbrevo/brevo';

// Helper function to send payment confirmation email to user
async function sendPaymentConfirmationEmail({ email, firstName, lastName, trackName, reference, amount }) {
  if (!process.env.BREVO_API_KEY || !email || !firstName || !lastName || !trackName) {
    return;
  }

  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    
    const paymentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const amountFormatted = (amount / 100).toLocaleString();
    const websiteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
    
    const userEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #666666;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .payment-details {
      background-color: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #00c896;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e1e4e8;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #666666;
      font-size: 14px;
    }
    .detail-value {
      color: #1a1a1a;
      font-weight: 600;
      font-size: 14px;
      text-align: right;
    }
    .track-info {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .track-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 15px;
    }
    .info-item {
      margin: 10px 0;
      font-size: 15px;
      color: #333333;
    }
    .info-item strong {
      color: #0066cc;
    }
    .next-steps {
      background-color: #fff3cd;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #ffc107;
    }
    .next-steps h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    .steps-list li {
      margin: 10px 0;
      color: #666666;
      line-height: 1.8;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666666;
      font-size: 14px;
      border-top: 1px solid #e1e4e8;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      color: #0066cc;
      text-decoration: none;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Payment Confirmed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to CVERSE</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hello ${firstName} ${lastName},
      </div>

      <div class="message">
        Thank you for your payment! Your application for the <strong>${trackName}</strong> bootcamp has been confirmed. We're excited to have you join us on this learning journey!
      </div>

      <!-- Payment Details -->
      <div class="payment-details">
        <h2 style="margin-top: 0; color: #1a1a1a; font-size: 18px;">Payment Details</h2>
        
        <div class="detail-row">
          <span class="detail-label">Payment Reference:</span>
          <span class="detail-value">${reference}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">₦${amountFormatted}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Date:</span>
          <span class="detail-value">${paymentDate}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value">Paystack</span>
        </div>
      </div>

      <!-- Course Information -->
      <div class="track-info">
        <div class="track-title">📚 Your Course: ${trackName}</div>
        
        <div class="info-item">
          <strong>Duration:</strong> 12 Weeks
        </div>
        
        <div class="info-item">
          <strong>Schedule:</strong> Saturdays, 9am - 11am & 12pm - 2pm
        </div>
        
        <div class="info-item">
          <strong>Start Date:</strong> February 2026
        </div>
        
        <div class="info-item">
          <strong>End Date:</strong> April 2026
        </div>
        
        <div class="info-item">
          <strong>Includes:</strong> Certificate of Completion & Class Recordings
        </div>
      </div>

      <!-- Next Steps -->
      <div class="next-steps">
        <h2>📋 What's Next?</h2>
        <ol class="steps-list">
          <li><strong>Check your email</strong> - You'll receive course preparation materials within 48 hours</li>
          <li><strong>Join our community</strong> - Look out for an invitation to join our exclusive Slack channel</li>
          <li><strong>Prepare your workspace</strong> - We'll send you a list of required software and tools to install before the course starts</li>
          <li><strong>Mark your calendar</strong> - Classes begin on Saturday, February 2026 at 9:00 AM</li>
        </ol>
      </div>

      <div class="message">
        If you have any questions or need assistance, please don't hesitate to reach out to us at <a href="mailto:admin@demirti.com" style="color: #0066cc;">admin@demirti.com</a> or reply to this email.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>CVERSE</strong></p>
      <p>Empowering careers through practical, hands-on learning</p>
      
      <div class="social-links">
        <a href="${websiteUrl}">Website</a> |
        <a href="mailto:admin@demirti.com">Email</a>
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #999999;">
        This is an automated confirmation email. Please do not reply directly to this message.<br>
        If you have questions, contact us at <a href="mailto:admin@demirti.com" style="color: #0066cc;">admin@demirti.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    const userEmail = new brevo.SendSmtpEmail();
    userEmail.sender = {
      name: 'CVERSE',
      email: process.env.BREVO_FROM_EMAIL || 'noreply@demirti.com'
    };
    userEmail.to = [{ email: email, name: `${firstName} ${lastName}` }];
    userEmail.subject = `Payment Confirmed - Welcome to CVERSE ${trackName} Bootcamp! 🎉`;
    userEmail.htmlContent = userEmailHtml;
    
    await apiInstance.sendTransacEmail(userEmail);
    console.log(`Payment confirmation email sent to user: ${email}`);
  } catch (error) {
    console.error('Error sending payment confirmation email to user:', error);
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
          // Get application details for email
          const appResult = await sql`
            SELECT first_name, last_name FROM applications
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
            
            // Send confirmation email to user
            if (firstName && lastName) {
              await sendPaymentConfirmationEmail({
                email,
                firstName,
                lastName,
                trackName,
                reference,
                amount
              });
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

        // Send payment confirmation email to user
        if (customer?.email && firstName && lastName && trackName) {
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

