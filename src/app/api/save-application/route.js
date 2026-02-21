import { NextResponse } from 'next/server';
import { saveApplication, getAllApplications } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { logger, reportError } from '@/lib/logger';
import { Resend } from 'resend';
import { validateBody, applicationSchema } from '@/lib/schemas';

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Send email notification to admin via Resend
async function sendApplicationEmail(application, isPaid = false) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return;
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
    const statusText = isPaid ? 'PAID' : 'PENDING PAYMENT';
    const statusColor = isPaid ? '#00c896' : '#ffc107';

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #e1e4e8; }
            .status-badge { 
              display: inline-block; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: 600; 
              margin-bottom: 20px;
              background-color: ${statusColor};
              color: white;
            }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #666; }
            .value { color: #1a1a1a; margin-top: 5px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e4e8; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Application Received</h2>
            </div>
            <div class="content">
              <span class="status-badge">${statusText}</span>
              
              <div class="field">
                <div class="label">Track:</div>
                <div class="value">${application.track_name}</div>
              </div>
              
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${application.first_name} ${application.last_name}</div>
              </div>
              
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${application.email}</div>
              </div>
              
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${application.phone}</div>
              </div>
              
              ${application.referral_source ? `
              <div class="field">
                <div class="label">How did you hear about Cverse:</div>
                <div class="value">${application.referral_source}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Payment Method:</div>
                <div class="value">${application.payment_option}</div>
              </div>
              
              ${application.payment_reference ? `
              <div class="field">
                <div class="label">Payment Reference:</div>
                <div class="value">${application.payment_reference}</div>
              </div>
              ` : ''}
              
              ${application.amount ? `
              <div class="field">
                <div class="label">Amount:</div>
                <div class="value">₦${(application.amount / 100).toLocaleString()}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Application Date:</div>
                <div class="value">${new Date(application.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from the CVERSE application system.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: `CVERSE Application System <${fromEmail}>`,
      to: 'admin@demirti.com',
      subject: `New ${statusText} Application: ${application.track_name} - ${application.first_name} ${application.last_name}`,
      html,
      text: `New Application Received - ${statusText}

Track: ${application.track_name}
Name: ${application.first_name} ${application.last_name}
Email: ${application.email}
Phone: ${application.phone}
${application.referral_source ? `How did you hear about Cverse: ${application.referral_source}` : ''}
Payment Method: ${application.payment_option}
${application.payment_reference ? `Payment Reference: ${application.payment_reference}` : ''}
${application.amount ? `Amount: ₦${(application.amount / 100).toLocaleString()}` : ''}
Application Date: ${new Date(application.created_at).toLocaleString()}`
    });

    if (error) {
      reportError(error, { route: 'save-application', action: 'send-email' });
    } else {
      logger.info('Application email sent to admin', { via: 'resend' });
    }
  } catch (error) {
    reportError(error, { route: 'save-application', action: 'send-email' });
    // Don't throw to avoid failing the main request
  }
}

// POST - Save application
export async function POST(request) {
  try {
    const [data, validationErr] = await validateBody(request, applicationSchema);
    if (validationErr) return validationErr;
    const { firstName, lastName, email, phone, trackName, paymentOption, paymentReference, amount, referralSource, discountCode } = data;

    const applicationData = {
      firstName,
      lastName,
      email,
      phone,
      trackName,
      paymentOption: paymentOption ?? 'paystack',
      paymentReference: paymentReference ?? null,
      amount: amount ?? null,
      referralSource: referralSource ?? null,
      discountCode: discountCode ?? null,
    };

    // Save application to database
    const savedApplication = await saveApplication(applicationData);

    // Send email notification
    try {
      await sendApplicationEmail(savedApplication, !!paymentReference);
    } catch (emailError) {
      reportError(emailError, { route: 'save-application', action: 'send-email-after-save' });
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application saved successfully',
      application: savedApplication
    });
  } catch (error) {
    reportError(error, { route: 'POST /api/save-application' });
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 }
    );
  }
}

// GET - Get all applications (admin only)
export async function GET(request) {
  const [, authErr] = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const applications = await getAllApplications();
    return NextResponse.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    reportError(error, { route: 'GET /api/save-application' });
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}
