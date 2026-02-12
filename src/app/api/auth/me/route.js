import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePictureUrl: user.profile_picture_url,
      phone: user.phone ?? null,
      address: user.address ?? null,
      yearsExperience: user.years_experience != null ? user.years_experience : null,
      mustChangePassword: !!user.must_change_password,
    },
  });
}
