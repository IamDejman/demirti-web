import { NextResponse } from 'next/server';
import { saveApplication, getAllApplications } from '@/lib/db';
import * as brevo from '@getbrevo/brevo';

// Send email notification to admin
async function sendApplicationEmail(application, isPaid = false) {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('Brevo API key is not configured');
      return;
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.sender = {
      name: 'CVERSE Application System',
      email: process.env.BREVO_FROM_EMAIL || 'noreply@demirti.com'
    };

    sendSmtpEmail.to = [{ email: 'admin@demirti.com' }];

    const statusText = isPaid ? 'PAID' : 'PENDING PAYMENT';
    const statusColor = isPaid ? '#00c896' : '#ffc107';

    sendSmtpEmail.subject = `New ${statusText} Application: ${application.track_name} - ${application.first_name} ${application.last_name}`;

    sendSmtpEmail.htmlContent = `
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

    sendSmtpEmail.textContent = `
New Application Received - ${statusText}

Track: ${application.track_name}
Name: ${application.first_name} ${application.last_name}
Email: ${application.email}
Phone: ${application.phone}
Payment Method: ${application.payment_option}
${application.payment_reference ? `Payment Reference: ${application.payment_reference}` : ''}
${application.amount ? `Amount: ₦${(application.amount / 100).toLocaleString()}` : ''}
Application Date: ${new Date(application.created_at).toLocaleString()}
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Application email sent to admin@demirti.com');
  } catch (error) {
    console.error('Error sending application email:', error);
    throw error;
  }
}

// POST - Save application
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, trackName, paymentOption, paymentReference, amount } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !trackName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const applicationData = {
      firstName,
      lastName,
      email,
      phone,
      trackName,
      paymentOption: paymentOption || 'paystack',
      paymentReference: paymentReference || null,
      amount: amount || null,
    };

    // Save application to database
    const savedApplication = await saveApplication(applicationData);

    // Send email notification
    try {
      await sendApplicationEmail(savedApplication, !!paymentReference);
    } catch (emailError) {
      console.error('Failed to send email, but application saved:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application saved successfully',
      application: savedApplication
    });
  } catch (error) {
    console.error('Error saving application:', error);
    return NextResponse.json(
      { error: 'Failed to save application', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get all applications (for admin use)
export async function GET() {
  try {
    const applications = await getAllApplications();
    return NextResponse.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    return NextResponse.json(
      { error: 'Failed to get applications', details: error.message },
      { status: 500 }
    );
  }
}
