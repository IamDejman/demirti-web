import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromRequest } from '@/lib/auth';
import { ensureLmsSchema } from '@/lib/db-lms';

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      profilePictureUrl: user.profile_picture_url ?? null,
      phone: user.phone ?? '',
      address: user.address ?? '',
      yearsExperience: user.years_experience != null ? user.years_experience : null,
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
    console.error('PATCH /api/profile:', e);
    return NextResponse.json(
      { error: 'Failed to update profile', detail: process.env.NODE_ENV === 'development' ? e?.message : undefined },
      { status: 500 }
    );
  }
}
