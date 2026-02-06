import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

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
        <h2 style="color:#0066cc; margin-bottom:8px;">${announcement.title}</h2>
        <p style="margin:0 0 16px;">Hello ${firstName || 'there'},</p>
        <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
          ${announcement.body?.replace(/\n/g, '<br/>') || ''}
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
        <h2 style="color:#0066cc; margin-bottom:8px;">${roomTitle || 'Chat'}</h2>
        <p style="margin:0 0 12px;">Hello ${firstName || 'there'},</p>
        <p style="margin:0 0 12px;"><strong>${senderName}</strong> sent a new message:</p>
        <div style="background:#f8f9fa; padding:12px; border-radius:8px;">
          ${resolvedBody.replace(/\n/g, '<br/>')}
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
        <h2 style="color:#0066cc; margin-bottom:8px;">${title || assignment?.title || 'Assignment update'}</h2>
        <p style="margin:0 0 16px;">Hello ${firstName || 'there'},</p>
        <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
          ${description.replace(/\n/g, '<br/>')}
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
      <h2 style="color:#0066cc; margin-bottom:8px;">${title || `Graded: ${assignment?.title || 'Assignment'}`}</h2>
      <p style="margin:0 0 16px;">Hello ${firstName || 'there'},</p>
      <div style="background:#f8f9fa; padding:16px; border-radius:8px;">
        ${description.replace(/\n/g, '<br/>')}
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
