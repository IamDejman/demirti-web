import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function sendPaymentConfirmationEmail({
  email,
  firstName = '',
  lastName = '',
  trackName,
  reference,
  amount,
}) {
  if (!process.env.RESEND_API_KEY || !email) {
    console.error('Resend configuration missing or email not provided. Skipping user confirmation email.', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      hasEmail: !!email,
    });
    return;
  }

  try {
    const resolvedTrackName = trackName && trackName.trim().length > 0 ? trackName : 'your course';
    const paymentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div class="header">
      <h1>🎉 Payment Confirmed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to CVERSE</p>
    </div>
    <div class="content">
      <div class="greeting">
        Hello ${firstName} ${lastName},
      </div>
      <div class="message">
        Thank you for your payment! Your application for the <strong>${resolvedTrackName}</strong> bootcamp has been confirmed. We're excited to have you join us on this learning journey!
      </div>
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
      <div class="track-info">
        <div class="track-title">📚 Your Course: ${resolvedTrackName}</div>
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

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';

    const { error } = await resend.emails.send({
      from: `CVERSE <${fromEmail}>`,
      to: email,
      subject: `Payment Confirmed - Welcome to CVERSE ${resolvedTrackName} Bootcamp! 🎉`,
      html: userEmailHtml,
    });

    if (error) {
      console.error('Resend user confirmation email failed', error);
    } else {
      console.log(`Payment confirmation email sent to user via Resend: ${email}`);
    }
  } catch (error) {
    console.error('Error sending payment confirmation email via Resend:', error);
  }
}


