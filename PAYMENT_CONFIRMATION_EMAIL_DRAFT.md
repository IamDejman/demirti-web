# Payment Confirmation Email - Draft

## Email Preview

**Subject:** Payment Confirmed - Welcome to CVERSE [Track Name] Bootcamp! 🎉

**To:** [User Email]
**From:** CVERSE <noreply@demirti.com>

---

### HTML Email Template

```html
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
    .success-icon {
      text-align: center;
      font-size: 64px;
      margin: 20px 0;
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
    .cta-button {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
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
      <div class="success-icon">✓</div>
      
      <div class="greeting">
        Hello [First Name] [Last Name],
      </div>

      <div class="message">
        Thank you for your payment! Your application for the <strong>[Track Name]</strong> bootcamp has been confirmed. We're excited to have you join us on this learning journey!
      </div>

      <!-- Payment Details -->
      <div class="payment-details">
        <h2 style="margin-top: 0; color: #1a1a1a; font-size: 18px;">Payment Details</h2>
        
        <div class="detail-row">
          <span class="detail-label">Payment Reference:</span>
          <span class="detail-value">[Payment Reference]</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">₦[Amount]</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Date:</span>
          <span class="detail-value">[Payment Date]</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span class="detail-value">Paystack</span>
        </div>
      </div>

      <!-- Course Information -->
      <div class="track-info">
        <div class="track-title">📚 Your Course: [Track Name]</div>
        
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
          <li><strong>Check your email</strong> - You'll receive course preparation materials and login details within 48 hours</li>
          <li><strong>Join our community</strong> - Look out for an invitation to join our exclusive Slack/Discord channel</li>
          <li><strong>Prepare your workspace</strong> - We'll send you a list of required software and tools to install before the course starts</li>
          <li><strong>Mark your calendar</strong> - Classes begin on Saturday, February 2026 at 9:00 AM</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="[Website URL]" class="cta-button">Visit Our Website</a>
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
        <a href="[Website]">Website</a> |
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
```

---

### Plain Text Version

```
🎉 Payment Confirmed - Welcome to CVERSE [Track Name] Bootcamp!

Hello [First Name] [Last Name],

Thank you for your payment! Your application for the [Track Name] bootcamp has been confirmed. We're excited to have you join us on this learning journey!

PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment Reference: [Payment Reference]
Amount Paid: ₦[Amount]
Payment Date: [Payment Date]
Payment Method: Paystack

YOUR COURSE: [Track Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration: 12 Weeks
Schedule: Saturdays, 9am - 11am & 12pm - 2pm
Start Date: February 2026
End Date: April 2026
Includes: Certificate of Completion & Class Recordings

WHAT'S NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Check your email - You'll receive course preparation materials and login details within 48 hours
2. Join our community - Look out for an invitation to join our exclusive Slack/Discord channel
3. Prepare your workspace - We'll send you a list of required software and tools to install before the course starts
4. Mark your calendar - Classes begin on Saturday, February 2026 at 9:00 AM

If you have any questions or need assistance, please don't hesitate to reach out to us at admin@demirti.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CVERSE
Empowering careers through practical, hands-on learning

Website: [Website URL]
Email: admin@demirti.com

This is an automated confirmation email. Please do not reply directly to this message.
If you have questions, contact us at admin@demirti.com
```

---

## Email Features

✅ **Professional Design**
- Clean, modern layout with brand colors
- Responsive design that works on all devices
- Clear visual hierarchy

✅ **Comprehensive Information**
- Payment confirmation details
- Course information (schedule, dates, duration)
- Next steps for the student

✅ **Brand Consistency**
- Uses CVERSE brand colors (#0066cc, #00c896)
- Professional tone
- Clear call-to-action

✅ **User-Friendly**
- Easy to scan and read
- Clear sections for different information
- Helpful next steps

---

## Dynamic Variables

The following will be replaced with actual values:
- `[First Name]` - User's first name
- `[Last Name]` - User's last name
- `[Track Name]` - Course track (Data Science or Project Management)
- `[Payment Reference]` - Paystack payment reference
- `[Amount]` - Amount paid (formatted with commas)
- `[Payment Date]` - Date and time of payment
- `[Website URL]` - Your website URL

