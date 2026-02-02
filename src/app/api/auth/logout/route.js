import { NextResponse } from 'next/server';
import { deleteUserSession } from '@/lib/auth';

function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
  const cookie = request.headers.get('cookie');
  const m = cookie?.match(/lms_token=([^;]+)/);
  return m ? m[1].trim() : null;
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  if (token) await deleteUserSession(token);
  const res = NextResponse.json({ success: true, message: 'Logged out' });
  res.cookies.set('lms_token', '', { path: '/', maxAge: 0 });
  return res;
}
