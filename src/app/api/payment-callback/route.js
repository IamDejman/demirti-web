import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateApplicationPayment, saveApplication, incrementScholarshipCount } from '@/lib/db';
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
        // Try to update existing pending application
        savedApplication = await updateApplicationPayment(
          customer.email,
          trackName,
          reference,
          amount
        );

        // If no existing application found, create a new one
        if (!savedApplication) {
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

        console.log('Application saved with payment details');

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

      // Increment scholarship count if payment is successful
      try {
        await incrementScholarshipCount();
        console.log('Scholarship count incremented');
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

