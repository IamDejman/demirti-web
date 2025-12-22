import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message, subject, recipients } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'Brevo API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    // Prepare email data
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Set sender
    sendSmtpEmail.sender = {
      name: name,
      email: email
    };

    // Set recipients - if recipients array is provided, use it; otherwise use default
    const recipientList = recipients && recipients.length > 0 
      ? recipients.map(recipient => ({ email: recipient }))
      : [{ email: process.env.BREVO_TO_EMAIL || 'admin@demirti.com' }];

    sendSmtpEmail.to = recipientList;

    // Set subject
    sendSmtpEmail.subject = subject || `Contact Form Submission from ${name}`;

    // Set HTML content
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </body>
      </html>
    `;

    // Set text content (fallback)
    sendSmtpEmail.textContent = `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `;

    // Send email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

