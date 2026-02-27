import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendAnnouncementEmails({ recipients, announcement }) {
  if (!process.env.RESEND_API_KEY || !Array.isArray(recipients) || recipients.length === 0) {
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';
  const subject = `[CVERSE] ${announcement.title}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';

  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const firstName = recipient.first_name || recipient.firstName || '';
    const html = `
      <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6;">
        <h2 style="color:#0066cc; margin-bottom:8px;">${escapeHtml(announcement.title)}</h2>
        <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName) || 'there'},</p>
        <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
          ${escapeHtml(announcement.body)?.replace(/\n/g, '<br/>') || ''}
        </div>
        <p style="margin-top:16px;">You can log in to your dashboard for more details.</p>
        <a href="${baseUrl}" style="display:inline-block; margin-top:8px; color:#0066cc;">Open CVERSE Academy</a>
      </div>
    `;
    try {
      await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Resend announcement email failed', error);
    }
  }
}

export async function sendChatMessageEmails({ recipients, message, sender, roomTitle, title, body }) {
  if (!process.env.RESEND_API_KEY || !Array.isArray(recipients) || recipients.length === 0) {
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
  const senderName = sender?.first_name || sender?.email || 'Someone';
  const bodyText = message?.body || '';
  const snippet = bodyText.length > 160 ? `${bodyText.slice(0, 160)}...` : bodyText;
  const subject = title ? `[CVERSE] ${title}` : `[CVERSE] New message in ${roomTitle || 'chat'}`;

  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const firstName = recipient.first_name || recipient.firstName || '';
    const resolvedBody = body || snippet;
    const html = `
      <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6;">
        <h2 style="color:#0066cc; margin-bottom:8px;">${escapeHtml(roomTitle) || 'Chat'}</h2>
        <p style="margin:0 0 12px;">Hello ${escapeHtml(firstName) || 'there'},</p>
        <p style="margin:0 0 12px;"><strong>${escapeHtml(senderName)}</strong> sent a new message:</p>
        <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
          ${escapeHtml(resolvedBody).replace(/\n/g, '<br/>')}
        </div>
        <p style="margin-top:16px;">Open your dashboard to reply.</p>
        <a href="${baseUrl}" style="display:inline-block; margin-top:8px; color:#0066cc;">Open CVERSE Academy</a>
      </div>
    `;
    try {
      await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Resend chat email failed', error);
    }
  }
}

export async function sendAssignmentEmails({ recipients, assignment, title, body }) {
  if (!process.env.RESEND_API_KEY || !Array.isArray(recipients) || recipients.length === 0) {
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
  const subject = `[CVERSE] ${title || assignment?.title || 'New assignment'}`;
  const description = body || assignment?.description || '';
  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const firstName = recipient.first_name || recipient.firstName || '';
    const html = `
      <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6;">
        <h2 style="color:#0066cc; margin-bottom:8px;">${escapeHtml(title || assignment?.title || 'Assignment update')}</h2>
        <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName) || 'there'},</p>
        <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
          ${escapeHtml(description).replace(/\n/g, '<br/>')}
        </div>
        <p style="margin-top:16px;">Open your dashboard to view details.</p>
        <a href="${baseUrl}/dashboard/assignments" style="display:inline-block; margin-top:8px; color:#0066cc;">View assignments</a>
      </div>
    `;
    try {
      await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Resend assignment email failed', error);
    }
  }
}

export async function sendEnrollmentEmail({ recipient, cohort, tempPassword }) {
  if (!process.env.RESEND_API_KEY || !recipient?.email) {
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
  const firstName = recipient.first_name || recipient.firstName || '';
  const cohortName = cohort?.name || 'your cohort';
  const startDate = cohort?.start_date ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Africa/Lagos' }).format(new Date(cohort.start_date)) : '';
  const endDate = cohort?.end_date ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Africa/Lagos' }).format(new Date(cohort.end_date)) : '';

  if (tempPassword) {
    // New user — send credentials
    const subject = `Welcome to CVERSE — Your Login Details for ${cohortName}`;
    const html = `
      <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6; max-width:520px; margin:0 auto;">
        <h2 style="color:#0066cc; margin-bottom:8px;">Welcome to CVERSE Academy!</h2>
        <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName) || 'there'},</p>
        <p style="margin:0 0 16px;">You have been enrolled in <strong>${escapeHtml(cohortName)}</strong>${startDate ? ` starting ${escapeHtml(startDate)}` : ''}${endDate ? ` and running until ${escapeHtml(endDate)}` : ''}.</p>
        <p style="margin:0 0 8px;">Here are your login details:</p>
        <div style="background:#f0f4ff; border:1px solid #d0dff7; padding:16px; border-radius:8px; margin-bottom:16px;">
          <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(recipient.email)}</p>
          <p style="margin:0;"><strong>Temporary Password:</strong> <span style="font-family:monospace; font-size:1.1em; letter-spacing:0.05em;">${escapeHtml(tempPassword)}</span></p>
        </div>
        <p style="margin:0 0 16px; color:#dc2626;">You will be asked to set a new password on your first login.</p>
        <a href="${baseUrl}/login" style="display:inline-block; background:#0066cc; color:#fff; padding:10px 24px; border-radius:6px; text-decoration:none; font-weight:600;">Log in to CVERSE</a>
        <p style="margin-top:24px; font-size:0.875rem; color:#6b7280;">If you have any questions, reply to this email or reach out to your cohort admin.</p>
      </div>
    `;
    try {
      await resend.emails.send({ from: fromEmail, to: recipient.email, subject, html });
    } catch (error) {
      console.error('Resend enrollment email failed', error);
    }
  } else {
    // Existing user — enrollment notification only
    const subject = `You've been enrolled in ${cohortName}`;
    const html = `
      <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6; max-width:520px; margin:0 auto;">
        <h2 style="color:#0066cc; margin-bottom:8px;">Enrollment Confirmation</h2>
        <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName) || 'there'},</p>
        <p style="margin:0 0 16px;">You have been enrolled in <strong>${escapeHtml(cohortName)}</strong>${startDate ? ` starting ${escapeHtml(startDate)}` : ''}${endDate ? ` and running until ${escapeHtml(endDate)}` : ''}.</p>
        <a href="${baseUrl}/dashboard" style="display:inline-block; background:#0066cc; color:#fff; padding:10px 24px; border-radius:6px; text-decoration:none; font-weight:600;">Go to Dashboard</a>
        <p style="margin-top:24px; font-size:0.875rem; color:#6b7280;">If you have any questions, reply to this email or reach out to your cohort admin.</p>
      </div>
    `;
    try {
      await resend.emails.send({ from: fromEmail, to: recipient.email, subject, html });
    } catch (error) {
      console.error('Resend enrollment notification email failed', error);
    }
  }
}

export async function sendGradeEmail({ recipient, assignment, title, body }) {
  if (!process.env.RESEND_API_KEY || !recipient?.email) {
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://demirti.com';
  const subject = `[CVERSE] ${title || `Graded: ${assignment?.title || 'Assignment'}`}`;
  const description = body || '';
  const firstName = recipient.first_name || recipient.firstName || '';
  const html = `
    <div style="font-family:Arial, sans-serif; color:#1a1a1a; line-height:1.6;">
      <h2 style="color:#0066cc; margin-bottom:8px;">${escapeHtml(title || `Graded: ${assignment?.title || 'Assignment'}`)}</h2>
      <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName) || 'there'},</p>
      <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
        ${escapeHtml(description).replace(/\n/g, '<br/>')}
      </div>
      <p style="margin-top:16px;">Open your dashboard to review feedback.</p>
      <a href="${baseUrl}/dashboard/assignments" style="display:inline-block; margin-top:8px; color:#0066cc;">View assignment</a>
    </div>
  `;
  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipient.email,
      subject,
      html,
    });
  } catch (error) {
    console.error('Resend grade email failed', error);
  }
}
