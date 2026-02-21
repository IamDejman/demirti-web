import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Resend allows 2 requests per second - use 600ms delay to stay under limit
const DELAY_BETWEEN_SENDS_MS = 600;
const MAX_RETRIES_ON_RATE_LIMIT = 4;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();
  return (
    error.statusCode === 429 ||
    error.status === 429 ||
    name === 'rate_limit_exceeded' ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

async function sendWithRetry(sendFn) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES_ON_RATE_LIMIT; attempt++) {
    const result = await sendFn();
    if (result.error) {
      lastError = result.error;
      if (isRateLimitError(result.error) && attempt < MAX_RETRIES_ON_RATE_LIMIT) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { error: result.error };
    }
    return { data: result.data };
  }
  return { error: lastError };
}

export async function POST(request) {
  const admin = await getAdminOrUserFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipients, subject, htmlContent, textContent, senderName, senderEmail, attachments } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must contain at least one email' },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key is not configured' },
        { status: 500 }
      );
    }

    const fromEmail = senderEmail?.trim() || process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
    const fromName = senderName?.trim() || 'CVERSE';

    const recipientList = recipients
      .map((recipient) => {
        if (typeof recipient === 'string') {
          return recipient.trim() && recipient.includes('@')
            ? { email: recipient.trim(), name: '', firstName: '', lastName: '' }
            : null;
        }
        if (recipient && recipient.email && recipient.email.includes('@')) {
          const firstName = (recipient.firstName != null && recipient.firstName !== undefined) ? String(recipient.firstName).trim() : '';
          const lastName = (recipient.lastName != null && recipient.lastName !== undefined) ? String(recipient.lastName).trim() : '';
          const name = recipient.name ? recipient.name.trim() : [firstName, lastName].filter(Boolean).join(' ');
          return {
            email: recipient.email.trim(),
            name: name || '',
            firstName,
            lastName,
          };
        }
        return null;
      })
      .filter((r) => r !== null);

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found in recipients list' },
        { status: 400 }
      );
    }

    const hasPlaceholders = recipientList.some((r) => r.name || r.firstName || r.lastName);
    const resendAttachments = attachments?.length
      ? attachments.map((a) => ({ filename: a.name || 'attachment', content: a.content }))
      : undefined;

    const results = [];
    const errors = [];

    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];

      // Rate limit: wait between sends (except before first)
      if (i > 0) {
        await sleep(DELAY_BETWEEN_SENDS_MS);
      }

      let html = htmlContent.trim();
      let text = textContent?.trim();
      if (!text) {
        text = html
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      }
      if (hasPlaceholders) {
        const firstName = recipient.firstName || '';
        const lastName = recipient.lastName || '';
        const fullName = recipient.name || [firstName, lastName].filter(Boolean).join(' ');
        html = html
          .replace(/\{\{First_Name\}\}|\{First_Name\}/gi, firstName)
          .replace(/\{\{Last_Name\}\}|\{Last_Name\}/gi, lastName)
          .replace(/\{\{name\}\}|\{name\}/gi, fullName);
        text = text
          .replace(/\{\{First_Name\}\}|\{First_Name\}/gi, firstName)
          .replace(/\{\{Last_Name\}\}|\{Last_Name\}/gi, lastName)
          .replace(/\{\{name\}\}|\{name\}/gi, fullName);
      }

      const payload = {
        from: `${fromName} <${fromEmail}>`,
        to: recipient.email,
        subject: subject.trim(),
        html,
        text,
        attachments: resendAttachments,
      };

      const { data, error } = await sendWithRetry(() => resend.emails.send(payload));

      if (error) {
        errors.push({
          email: recipient.email,
          error: error.message || 'Unknown error',
          details: error.statusCode === 429 ? 'Rate limited (retried)' : undefined,
        });
        continue;
      }
      results.push({ email: recipient.email, messageId: data?.id });
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.length} email(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      sentCount: results.length,
      failedCount: errors.length,
      recipients: results.map((r) => r.email),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    reportError(error, { route: 'POST /api/send-bulk-email' });
    return NextResponse.json({ error: 'Failed to send bulk email' }, { status: 500 });
  }
}
