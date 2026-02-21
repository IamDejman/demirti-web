import { NextResponse } from 'next/server';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { reportError } from '@/lib/logger';
import { getAllApplications, getAllSponsoredApplications } from '@/lib/db';
import { sendBootcampWelcomeEmail } from '@/lib/bootcampWelcomeEmails';
import { recordAuditLog } from '@/lib/audit';
import { DEFAULT_SPONSORED_COHORT } from '@/lib/config';

const TRACK_NAME = 'Data Science';
const SPONSORED_COHORT = DEFAULT_SPONSORED_COHORT;

export async function POST(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { emails } = body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'emails array is required and must contain at least one email' },
        { status: 400 }
      );
    }

    // Build email -> name map from applications and sponsored
    const nameMap = new Map();
    const applications = (await getAllApplications()).filter((app) => app.track_name === TRACK_NAME);
    for (const app of applications) {
      const email = (app.email || '').toLowerCase();
      if (email) {
        nameMap.set(email, { firstName: app.first_name || '', lastName: app.last_name || '' });
      }
    }
    const sponsored = await getAllSponsoredApplications({
      reviewStatus: 'accepted',
      cohortName: SPONSORED_COHORT,
    });
    const confirmedSponsored = sponsored.filter((s) => s.confirmed_at != null);
    for (const s of confirmedSponsored) {
      const email = (s.email || '').toLowerCase();
      if (email && !nameMap.has(email)) {
        nameMap.set(email, { firstName: s.first_name || '', lastName: s.last_name || '' });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = [...new Set(emails.map((e) => (e || '').trim().toLowerCase()).filter(Boolean))]
      .filter((email) => emailRegex.test(email) && !/[\r\n]/.test(email))
      .map((email) => {
        const names = nameMap.get(email) || { firstName: '', lastName: '' };
        return { email, firstName: names.firstName, lastName: names.lastName };
      });

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: 'No recipients match the selected filters.',
      });
    }

    let sentCount = 0;
    const errors = [];

    for (const r of recipients) {
      const result = await sendBootcampWelcomeEmail({
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
      });
      if (result.success) {
        sentCount++;
      } else {
        errors.push({ email: r.email, error: result.error });
      }
    }

    const ipAddress = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    await recordAuditLog({
      userId: admin.id,
      action: 'bootcamp_welcome.send',
      targetType: 'email',
      targetId: null,
      details: {
        recipientCount: recipients.length,
        sentCount,
        failedCount: errors.length,
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount: errors.length,
      message: `Sent ${sentCount} email(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    reportError(error, { route: 'POST /api/admin/send-bootcamp-welcome' });
    return NextResponse.json(
      { error: 'Failed to send bootcamp welcome emails' },
      { status: 500 }
    );
  }
}
