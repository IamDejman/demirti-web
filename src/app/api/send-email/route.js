import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const limiter = await rateLimit(`contact_form_${ip}`, { windowMs: 60_000, limit: 5 });
  if (!limiter.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, email, message, subject, recipients } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and message are required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key is not configured' },
        { status: 500 }
      );
    }

    const toList = recipients && recipients.length > 0
      ? recipients
      : ['admin@demirti.com'];

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';

    const html = `
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

    const text = `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Message: ${message}
    `;

    const { data, error } = await resend.emails.send({
      from: `CVERSE Contact <${fromEmail}>`,
      to: toList,
      replyTo: email,
      subject: subject || `Contact Form Submission from ${name}`,
      html,
      text,
    });

    if (error) {
      console.error('Resend contact form email failed', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Email sent successfully', messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
