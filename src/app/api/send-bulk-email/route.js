import { NextResponse } from 'next/server';
import { Resend } from 'resend';
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
            ? { email: recipient.trim(), name: '' }
            : null;
        }
        if (recipient && recipient.email && recipient.email.includes('@')) {
          return {
            email: recipient.email.trim(),
            name: recipient.name ? recipient.name.trim() : '',
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

    const hasNames = recipientList.some((r) => r.name && r.name.trim());
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
      if (hasNames && recipient.name) {
        html = html.replace(/\{\{name\}\}|\{name\}/gi, recipient.name);
        text = text.replace(/\{\{name\}\}|\{name\}/gi, recipient.name);
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
    console.error('Error sending bulk email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send bulk email',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
