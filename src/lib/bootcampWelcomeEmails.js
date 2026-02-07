import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const TELEGRAM_LINK = 'https://t.me/+0D-tUJ90yxIzYTVk';

export async function sendBootcampWelcomeEmail({ email, firstName = '', lastName = '' }) {
  if (!process.env.RESEND_API_KEY || !email) {
    console.error('Resend configuration missing or email not provided. Skipping bootcamp welcome email.', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      hasEmail: !!email,
    });
    return { success: false, error: 'Configuration missing' };
  }

  try {
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'there';

    const html = `
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
    .section {
      background-color: #f8f9fa;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #0066cc;
    }
    .section h2 {
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
      <h1>Welcome to the Cverse Data Science Bootcamp!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Next Steps</p>
    </div>
    <div class="content">
      <div class="greeting">
        Hello ${displayName},
      </div>
      <div class="message">
        Welcome to the Cverse Data Science Bootcamp! We're excited to have you on board and can't wait to start this learning journey with you.
        Below are the key details you'll need to get set up and ready before the program begins.
      </div>

      <div class="section">
        <h2>Program Overview</h2>
        <ul class="steps-list">
          <li><strong>Program:</strong> Data Science Bootcamp</li>
          <li><strong>Start Date:</strong> 28 February 2026</li>
          <li><strong>Duration:</strong> 2 sessions on Saturdays</li>
          <li><strong>Format:</strong> Live online sessions + hands-on projects</li>
          <li><strong>Schedule:</strong> 10am–12pm and 1pm–3pm</li>
        </ul>
        <p class="message" style="margin-bottom: 0;">A detailed course roadmap will be shared during orientation.</p>
      </div>

      <div class="section">
        <h2>Platform Access</h2>
        <p class="message">You'll receive separate emails with instructions to access:</p>
        <ul class="steps-list">
          <li><strong>Learning Platform (LMS):</strong> Course materials, class link recordings, and assignments</li>
          <li><strong>Community Space:</strong> Telegram for discussions, announcements, and peer support – <a href="${TELEGRAM_LINK}" style="color: #0066cc;">Join here</a></li>
        </ul>
        <p class="message" style="margin-bottom: 0;">Please complete your account setup as soon as you receive these emails.</p>
      </div>

      <div class="section">
        <h2>Technical Requirements</h2>
        <p class="message">To participate smoothly, ensure you have:</p>
        <ul class="steps-list">
          <li>A laptop (minimum 8GB RAM recommended)</li>
          <li>Stable internet connection</li>
          <li>Installed software: Python (latest version), Anaconda, Jupyter Notebook, VS Code (recommended)</li>
        </ul>
        <p class="message" style="margin-bottom: 0;">If you have any setup issues, feel free to reach out before orientation.</p>
      </div>

      <div class="section">
        <h2>Orientation & Onboarding</h2>
        <p class="message"><strong>Orientation Session:</strong> 21 February 2026 at 12 noon WAT</p>
        <p class="message">We'll walk through the curriculum, tools, expectations and answer your questions.</p>
        <p class="message" style="margin-bottom: 0;">Please complete any pre-course assessments or prep work sent before the Start Date.</p>
      </div>

      <div class="section">
        <h2>Expectations</h2>
        <ul class="steps-list">
          <li>Attend live sessions and re-watch recordings for clarity</li>
          <li>Complete weekly assignments and projects on time</li>
          <li>Actively participate in discussions and activities</li>
          <li>Follow the bootcamp's code of conduct and collaboration guidelines</li>
        </ul>
      </div>

      <div class="section">
        <h2>Support & Resources</h2>
        <p class="message">You'll have access to:</p>
        <ul class="steps-list">
          <li>Facilitators</li>
          <li>Technical and academic support</li>
          <li>Curated learning resources and datasets</li>
        </ul>
        <p class="message" style="margin-bottom: 0;">More information to be provided on this.</p>
      </div>

      <div class="section">
        <h2>Career Support</h2>
        <p class="message">Our bootcamp includes:</p>
        <ul class="steps-list">
          <li>Portfolio-building projects</li>
          <li>Career workshops and mentorship</li>
          <li>Resume and interview preparation</li>
          <li>Job and networking resources</li>
        </ul>
        <p class="message" style="margin-bottom: 0;">More details will be shared during the program.</p>
      </div>

      <div class="message">
        Look out for subsequent communication before the start date. We're thrilled to have you join us and are committed to supporting you every step of the way.
      </div>
      <div class="message">
        Get ready to learn, build, and grow as a data scientist!
      </div>
      <div class="message">
        If you have any questions, reach out at <a href="mailto:admin@demirti.com" style="color: #0066cc;">admin@demirti.com</a>.
      </div>
    </div>
    <div class="footer">
      <p><strong>CVERSE Team</strong></p>
      <p>Product of Demirti</p>
      <p><a href="mailto:admin@demirti.com">admin@demirti.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';

    const { error } = await resend.emails.send({
      from: `CVERSE <${fromEmail}>`,
      to: email,
      subject: 'Welcome to the Online Data Science Bootcamp – Next Steps',
      html,
    });

    if (error) {
      console.error('Resend bootcamp welcome email failed', { email, error });
      return { success: false, error: error.message };
    }
    console.log(`Bootcamp welcome email sent via Resend: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending bootcamp welcome email via Resend:', error);
    return { success: false, error: error.message };
  }
}
