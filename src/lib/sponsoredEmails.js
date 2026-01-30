import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
}

function getConfirmSpotUrl() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
  return `${base}/confirm-spot`;
}

export async function sendAcceptanceEmail({ email, firstName }) {
  if (!process.env.RESEND_API_KEY || !email) {
    console.error('Resend not configured or email missing. Skipping acceptance email.');
    return;
  }
  const fromEmail = getFromEmail();
  const confirmUrl = getConfirmSpotUrl();
  const displayName = (firstName && firstName.trim()) ? firstName.trim() : 'there';

  const subject = "You've Been Conditionally Accepted — Action Required Within 48 Hours";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { padding: 24px 0; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    p { margin: 0 0 16px; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin-bottom: 8px; }
    .cta { margin: 24px 0; }
    .cta a { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .signoff { margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p class="greeting">Hi ${displayName},</p>
      <p>Congratulations — you've been selected for a sponsored spot in the CVerse Data Science Academy.</p>
      <p>A sponsor has made this opportunity possible because they believe in investing in people ready to commit. Your application stood out, and we're excited to have you.</p>
      <p>To confirm your spot, you must complete one action within 48 hours:</p>
      <p><strong>Publish a LinkedIn post</strong> that includes:</p>
      <ul>
        <li>That you've been accepted into the CVerse Data Science Academy</li>
        <li>One thing you're committed to achieving through this program</li>
        <li>Tag @CVerse</li>
      </ul>
      <p>Once you've posted, reply to this email with the link to your post, or use the link below to submit your post URL:</p>
      <div class="cta"><a href="${confirmUrl}">Confirm your spot (submit LinkedIn post link)</a></div>
      <p>If we don't receive your LinkedIn post within 48 hours, your spot will be released to the waitlist. This isn't a formality—it's your first act of commitment.</p>
      <p>We look forward to seeing your post and welcoming you into the cohort.</p>
      <p class="signoff">Best,<br>The CVerse Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `Hi ${displayName},\n\nCongratulations — you've been selected for a sponsored spot in the CVerse Data Science Academy.\n\nA sponsor has made this opportunity possible because they believe in investing in people ready to commit. Your application stood out, and we're excited to have you.\n\nTo confirm your spot, you must complete one action within 48 hours:\n\nPublish a LinkedIn post that includes:\n• That you've been accepted into the CVerse Data Science Academy\n• One thing you're committed to achieving through this program\n• Tag @CVerse\n\nOnce you've posted, reply to this email with the link to your post, or confirm here: ${confirmUrl}\n\nIf we don't receive your LinkedIn post within 48 hours, your spot will be released to the waitlist. This isn't a formality—it's your first act of commitment.\n\nWe look forward to seeing your post and welcoming you into the cohort.\n\nBest,\nThe CVerse Team`;

  try {
    await resend.emails.send({
      from: `The CVerse Team <${fromEmail}>`,
      to: email,
      subject,
      html,
      text
    });
  } catch (err) {
    console.error('Error sending acceptance email:', err);
    throw err;
  }
}

export async function sendRejectionEmail({ email, firstName }) {
  if (!process.env.RESEND_API_KEY || !email) {
    console.error('Resend not configured or email missing. Skipping rejection email.');
    return;
  }
  const fromEmail = getFromEmail();
  const displayName = (firstName && firstName.trim()) ? firstName.trim() : 'there';

  const subject = 'Your CVerse Data Science Academy Application';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { padding: 24px 0; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    p { margin: 0 0 16px; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin-bottom: 8px; }
    .signoff { margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p class="greeting">Hi ${displayName},</p>
      <p>Thank you for applying to the CVerse Data Science Academy sponsored cohort.</p>
      <p>After reviewing all applications, we were unable to offer you a spot in this cohort. This was a difficult decision—we received many strong applications and had limited sponsored seats available.</p>
      <p>This doesn't mean data science isn't for you. If you're serious about learning, here are a few ways to continue:</p>
      <ul>
        <li>Follow CVerse on LinkedIn for free resources and future cohort announcements</li>
        <li>Apply again when we open the next sponsored cohort</li>
      </ul>
      <p>We appreciate your interest and wish you the best in your learning journey.</p>
      <p class="signoff">Best,<br>The CVerse Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `Hi ${displayName},\n\nThank you for applying to the CVerse Data Science Academy sponsored cohort.\n\nAfter reviewing all applications, we were unable to offer you a spot in this cohort. This was a difficult decision—we received many strong applications and had limited sponsored seats available.\n\nThis doesn't mean data science isn't for you. If you're serious about learning, here are a few ways to continue:\n• Follow CVerse on LinkedIn for free resources and future cohort announcements\n• Apply again when we open the next sponsored cohort\n\nWe appreciate your interest and wish you the best in your learning journey.\n\nBest,\nThe CVerse Team`;

  try {
    await resend.emails.send({
      from: `The CVerse Team <${fromEmail}>`,
      to: email,
      subject,
      html,
      text
    });
  } catch (err) {
    console.error('Error sending rejection email:', err);
    throw err;
  }
}

export async function sendWaitlistEmail({ email, firstName }) {
  if (!process.env.RESEND_API_KEY || !email) {
    console.error('Resend not configured or email missing. Skipping waitlist email.');
    return;
  }
  const fromEmail = getFromEmail();
  const displayName = (firstName && firstName.trim()) ? firstName.trim() : 'there';

  const subject = "You're on the Waitlist — CVerse Data Science Academy";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { padding: 24px 0; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    p { margin: 0 0 16px; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin-bottom: 8px; }
    .signoff { margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p class="greeting">Hi ${displayName},</p>
      <p>Thank you for applying to the CVerse Data Science Academy sponsored cohort.</p>
      <p>Your application was strong, and we'd like to offer you a place on our waitlist. If a selected applicant doesn't confirm their spot within the required timeframe, we'll reach out to you with an offer.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>Keep an eye on your inbox over the next 5–7 days</li>
        <li>If a spot opens, you'll receive a conditional acceptance email</li>
        <li>If no spots open, you'll be given priority consideration for the next sponsored cohort</li>
      </ul>
      <p>We'll be in touch either way.</p>
      <p class="signoff">Best,<br>The CVerse Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `Hi ${displayName},\n\nThank you for applying to the CVerse Data Science Academy sponsored cohort.\n\nYour application was strong, and we'd like to offer you a place on our waitlist. If a selected applicant doesn't confirm their spot within the required timeframe, we'll reach out to you with an offer.\n\nWhat this means:\n• Keep an eye on your inbox over the next 5–7 days\n• If a spot opens, you'll receive a conditional acceptance email\n• If no spots open, you'll be given priority consideration for the next sponsored cohort\n\nWe'll be in touch either way.\n\nBest,\nThe CVerse Team`;

  try {
    await resend.emails.send({
      from: `The CVerse Team <${fromEmail}>`,
      to: email,
      subject,
      html,
      text
    });
  } catch (err) {
    console.error('Error sending waitlist email:', err);
    throw err;
  }
}
