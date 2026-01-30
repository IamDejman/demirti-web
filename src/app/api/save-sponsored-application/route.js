import { NextResponse } from 'next/server';
import { saveSponsoredApplication } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function sendNewSponsoredApplicationEmail(application) {
  if (!process.env.RESEND_API_KEY) return;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@demirti.com';
  const essaySnippet = application.essay?.slice(0, 300) + (application.essay?.length > 300 ? '...' : '');
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #e1e4e8; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #666; }
          .value { color: #1a1a1a; margin-top: 5px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e4e8; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h2 style="margin: 0;">New Sponsored Cohort Application</h2></div>
          <div class="content">
            <div class="field"><div class="label">Name:</div><div class="value">${application.first_name} ${application.last_name}</div></div>
            <div class="field"><div class="label">Email:</div><div class="value">${application.email}</div></div>
            <div class="field"><div class="label">Phone:</div><div class="value">${application.phone}</div></div>
            ${application.linkedin_url ? `<div class="field"><div class="label">LinkedIn:</div><div class="value">${application.linkedin_url}</div></div>` : ''}
            ${application.city ? `<div class="field"><div class="label">City:</div><div class="value">${application.city}</div></div>` : ''}
            ${application.occupation ? `<div class="field"><div class="label">Occupation:</div><div class="value">${application.occupation}</div></div>` : ''}
            <div class="field"><div class="label">Essay (snippet):</div><div class="value">${essaySnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>
            <div class="field"><div class="label">Cohort:</div><div class="value">${application.cohort_name || 'Data Science Feb 2026'}</div></div>
          </div>
          <div class="footer"><p>Sponsored cohort application system.</p></div>
        </div>
      </body>
    </html>
  `;
  try {
    await resend.emails.send({
      from: `CVERSE Sponsored Cohort <${fromEmail}>`,
      to: 'admin@demirti.com',
      subject: `New Sponsored Application: ${application.first_name} ${application.last_name}`,
      html
    });
  } catch (e) {
    console.error('Failed to send sponsored application admin email:', e);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      linkedinUrl,
      city,
      occupation,
      essay,
      ackLinkedin48h,
      ackCommitment,
      cohortName
    } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: first name, last name, email, and phone are required' },
        { status: 400 }
      );
    }
    if (!essay || typeof essay !== 'string') {
      return NextResponse.json(
        { error: 'Essay is required' },
        { status: 400 }
      );
    }
    const wordCount = countWords(essay);
    if (wordCount > 300) {
      return NextResponse.json(
        { error: `Essay must be 300 words or fewer (currently ${wordCount} words)` },
        { status: 400 }
      );
    }
    if (wordCount < 1) {
      return NextResponse.json(
        { error: 'Essay cannot be empty' },
        { status: 400 }
      );
    }
    if (!ackLinkedin48h || !ackCommitment) {
      return NextResponse.json(
        { error: 'Both acknowledgement checkboxes must be checked' },
        { status: 400 }
      );
    }

    const applicationData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      linkedinUrl: linkedinUrl?.trim() || null,
      city: city?.trim() || null,
      occupation: occupation?.trim() || null,
      essay: essay.trim(),
      ackLinkedin48h: !!ackLinkedin48h,
      ackCommitment: !!ackCommitment,
      cohortName: cohortName?.trim() || 'Data Science Feb 2026'
    };

    const saved = await saveSponsoredApplication(applicationData);

    try {
      await sendNewSponsoredApplicationEmail(saved);
    } catch (emailError) {
      console.error('Failed to send admin email, but application saved:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Application received. We\'ll review and get back to you.',
      application: { id: saved.id, application_id: saved.application_id }
    });
  } catch (error) {
    console.error('Error saving sponsored application:', error);
    return NextResponse.json(
      { error: 'Failed to save application', details: error.message },
      { status: 500 }
    );
  }
}
