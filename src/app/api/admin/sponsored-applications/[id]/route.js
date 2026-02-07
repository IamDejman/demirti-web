import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/adminAuth';
import {
  getSponsoredApplicationById,
  updateSponsoredApplicationReviewStatus,
  markSponsoredApplicationForfeited,
  updateSponsoredApplicationConfirmation
} from '@/lib/db';
import { sendAcceptanceEmail, sendRejectionEmail, sendWaitlistEmail } from '@/lib/sponsoredEmails';

export async function PATCH(request, { params }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Application id required' }, { status: 400 });

  try {
    const body = await request.json();
    const { reviewStatus, linkedinPostUrl, action } = body;

    // Action: mark forfeited (no email)
    if (action === 'mark_forfeited') {
      const updated = await markSponsoredApplicationForfeited(id);
      if (!updated) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      return NextResponse.json({ success: true, application: updated });
    }

    // Action: promote next waitlist (set to accepted, set accepted_at, send acceptance email)
    if (action === 'promote_waitlist') {
      const app = await getSponsoredApplicationById(id);
      if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      if (app.review_status !== 'waitlist') {
        return NextResponse.json({ error: 'Application is not on waitlist' }, { status: 400 });
      }
      const updated = await updateSponsoredApplicationReviewStatus(id, 'accepted');
      if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      await sendAcceptanceEmail({
        email: updated.email,
        firstName: updated.first_name
      });
      return NextResponse.json({ success: true, application: updated });
    }

    // Action: confirm spot (admin sets linkedin_post_url and confirmed_at)
    if (action === 'confirm_spot' && linkedinPostUrl) {
      const updated = await updateSponsoredApplicationConfirmation(id, linkedinPostUrl);
      if (!updated) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      return NextResponse.json({ success: true, application: updated });
    }

    // Standard: set review status (accept / waitlist / reject) and send email
    if (!reviewStatus || !['accepted', 'waitlist', 'rejected'].includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'reviewStatus must be one of: accepted, waitlist, rejected' },
        { status: 400 }
      );
    }

    const app = await getSponsoredApplicationById(id);
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const updated = await updateSponsoredApplicationReviewStatus(id, reviewStatus);
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    const emailPayload = { email: updated.email, firstName: updated.first_name };
    if (reviewStatus === 'accepted') {
      await sendAcceptanceEmail(emailPayload);
    } else if (reviewStatus === 'waitlist') {
      await sendWaitlistEmail(emailPayload);
    } else {
      await sendRejectionEmail(emailPayload);
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error('Error updating sponsored application:', error);
    return NextResponse.json(
      { error: 'Failed to update application', details: process.env.NODE_ENV === 'development' ? error?.message : undefined },
      { status: 500 }
    );
  }
}
