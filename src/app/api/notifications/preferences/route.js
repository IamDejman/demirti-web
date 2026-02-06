import { NextResponse } from 'next/server';
import { getNotificationPreferences, setNotificationPreferences } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prefs = await getNotificationPreferences(user.id);
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    console.error('GET /api/notifications/preferences:', e);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const current = await getNotificationPreferences(user.id);
    const emailEnabled = body.emailEnabled !== false;
    const inAppEnabled = body.inAppEnabled !== false;
    const prefs = await setNotificationPreferences(user.id, {
      emailEnabled,
      inAppEnabled,
      emailAnnouncements: body.emailAnnouncements ?? current.email_announcements,
      emailChat: body.emailChat ?? current.email_chat,
      emailAssignments: body.emailAssignments ?? current.email_assignments,
      emailGrades: body.emailGrades ?? current.email_grades,
      emailDeadlines: body.emailDeadlines ?? current.email_deadlines,
      inAppAnnouncements: body.inAppAnnouncements ?? current.in_app_announcements,
      inAppChat: body.inAppChat ?? current.in_app_chat,
      inAppAssignments: body.inAppAssignments ?? current.in_app_assignments,
      inAppGrades: body.inAppGrades ?? current.in_app_grades,
      inAppDeadlines: body.inAppDeadlines ?? current.in_app_deadlines,
      pushAnnouncements: body.pushAnnouncements ?? current.push_announcements,
      pushChat: body.pushChat ?? current.push_chat,
      pushAssignments: body.pushAssignments ?? current.push_assignments,
      pushGrades: body.pushGrades ?? current.push_grades,
      pushDeadlines: body.pushDeadlines ?? current.push_deadlines,
    });
    return NextResponse.json({ preferences: prefs });
  } catch (e) {
    console.error('POST /api/notifications/preferences:', e);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
