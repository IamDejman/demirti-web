import { NextResponse } from 'next/server';
import { updateSponsoredApplicationConfirmationByEmail } from '@/lib/db';

function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length > 500) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, linkedinPostUrl } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    if (!linkedinPostUrl?.trim()) {
      return NextResponse.json(
        { error: 'Link to your LinkedIn post is required' },
        { status: 400 }
      );
    }
    if (!isValidUrl(linkedinPostUrl.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid URL for your LinkedIn post' },
        { status: 400 }
      );
    }

    const updated = await updateSponsoredApplicationConfirmationByEmail(
      email.trim().toLowerCase(),
      linkedinPostUrl.trim()
    );

    if (!updated) {
      return NextResponse.json(
        {
          error: 'We could not find an accepted application for this email, or the 48-hour window has passed. If you were just accepted, please confirm you’re within 48 hours and that the email matches your application.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your spot is confirmed. Thank you for sharing your LinkedIn post!'
    });
  } catch (error) {
    console.error('Error confirming sponsored spot:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', details: error.message },
      { status: 500 }
    );
  }
}
