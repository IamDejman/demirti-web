import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { reportError, safeErrorMessage } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
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
      profilePictureUrl: profileRow?.profile_picture_url ?? user.profile_picture_url ?? null,
      phone: profileRow?.phone ?? user.phone ?? '',
      address: profileRow?.address ?? '',
      yearsExperience: profileRow?.years_experience != null ? profileRow.years_experience : null,
    },
  });
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

    const sets = [];
    if (firstName !== undefined) {
      sets.push(sql`first_name = ${firstName}`);
    }
    if (lastName !== undefined) {
      sets.push(sql`last_name = ${lastName}`);
    }
    if (phone !== undefined) {
      sets.push(sql`phone = ${phone || null}`);
    }
    if (address !== undefined) {
      sets.push(sql`address = ${address || null}`);
    }
    if (yearsExperience !== undefined) {
      const val = Number.isNaN(yearsExperience) ? null : Math.max(0, Math.min(100, yearsExperience));
      sets.push(sql`years_experience = ${val}`);
    }
    if (profilePictureUrl !== undefined) {
      sets.push(sql`profile_picture_url = ${profilePictureUrl || null}`);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
    await sql`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

    return NextResponse.json({ ok: true });
  } catch (e) {
    reportError(e, { route: 'PATCH /api/profile' });
    return NextResponse.json({ error: safeErrorMessage(e, 'Failed to update profile') }, { status: 500 });
  }
}
