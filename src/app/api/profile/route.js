import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError, safeErrorMessage } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { ensureLmsSchema } from '@/lib/db-lms';
import { normalizeFileUrl } from '@/lib/storage';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    await ensureLmsSchema();
    const profileResult = await sql`
      SELECT id, email, first_name, last_name, profile_picture_url, phone, address, years_experience
      FROM users
      WHERE id = ${user.id}
      LIMIT 1;
    `;
    const profileRow = profileResult.rows[0];
    return NextResponse.json({
      profile: {
        id: profileRow?.id ?? user.id,
        email: profileRow?.email ?? user.email,
        firstName: profileRow?.first_name ?? user.first_name ?? '',
        lastName: profileRow?.last_name ?? user.last_name ?? '',
        profilePictureUrl: normalizeFileUrl(profileRow?.profile_picture_url ?? user.profile_picture_url ?? null),
        phone: profileRow?.phone ?? user.phone ?? '',
        address: profileRow?.address ?? '',
        yearsExperience: profileRow?.years_experience != null ? profileRow.years_experience : null,
      },
    });
  } catch (e) {
    reportError(e, { route: 'GET /api/profile' });
    return NextResponse.json({ error: safeErrorMessage(e, 'Failed to load profile') }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const address = typeof body.address === 'string' ? body.address.trim() : undefined;
    const yearsExperience = body.yearsExperience !== undefined
      ? (typeof body.yearsExperience === 'number' ? body.yearsExperience : parseInt(body.yearsExperience, 10))
      : undefined;
    const profilePictureUrl = typeof body.profilePictureUrl === 'string' ? body.profilePictureUrl.trim() : undefined;

    await ensureLmsSchema();

    // Fetch current values to merge with updates
    const currentRes = await sql`
      SELECT first_name, last_name, phone, address, years_experience, profile_picture_url
      FROM users WHERE id = ${user.id} LIMIT 1;
    `;
    const current = currentRes.rows[0];
    if (!current) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fName = firstName !== undefined ? firstName : current.first_name;
    const lName = lastName !== undefined ? lastName : current.last_name;
    const ph = phone !== undefined ? (phone || null) : current.phone;
    const addr = address !== undefined ? (address || null) : current.address;
    const yrsExp = yearsExperience !== undefined
      ? (Number.isNaN(yearsExperience) ? null : Math.max(0, Math.min(100, yearsExperience)))
      : current.years_experience;
    const picUrl = profilePictureUrl !== undefined ? (profilePictureUrl || null) : current.profile_picture_url;

    await sql`
      UPDATE users SET
        first_name = ${fName}, last_name = ${lName}, phone = ${ph},
        address = ${addr}, years_experience = ${yrsExp}, profile_picture_url = ${picUrl},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    reportError(e, { route: 'PATCH /api/profile' });
    return NextResponse.json({ error: safeErrorMessage(e, 'Failed to update profile') }, { status: 500 });
  }
}
