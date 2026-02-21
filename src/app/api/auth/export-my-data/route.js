import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getUserFromRequest } from '@/lib/auth';
import { ensureLmsSchema, getCohortIdsForUser } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    await ensureLmsSchema();

    const [profileRes, submissionsRes, portfolioRes, projectsRes, socialLinksRes, certsRes, cohortIds] =
      await Promise.all([
        sql`
          SELECT id, email, role, first_name, last_name, profile_picture_url, bio, phone, address,
                 years_experience, timezone, language_preference, created_at, last_login_at
          FROM users WHERE id = ${user.id} LIMIT 1;
        `,
        sql`
          SELECT s.id, s.assignment_id, s.submission_type, s.file_url, s.link_url, s.text_content, s.status,
                 s.score, s.feedback, s.submitted_at, s.graded_at, a.title AS assignment_title
          FROM assignment_submissions s
          JOIN assignments a ON a.id = s.assignment_id
          WHERE s.student_id = ${user.id}
          ORDER BY s.submitted_at DESC;
        `,
        sql`SELECT * FROM portfolios WHERE user_id = ${user.id} LIMIT 1;`,
        sql`
          SELECT pp.* FROM portfolio_projects pp
          JOIN portfolios p ON p.id = pp.portfolio_id
          WHERE p.user_id = ${user.id}
          ORDER BY pp.order_index ASC;
        `,
        sql`
          SELECT psl.* FROM portfolio_social_links psl
          JOIN portfolios p ON p.id = psl.portfolio_id
          WHERE p.user_id = ${user.id}
          ORDER BY psl.id ASC;
        `,
        sql`
          SELECT c.*, co.name AS cohort_name, t.track_name
          FROM certificates c
          LEFT JOIN cohorts co ON co.id = c.cohort_id
          LEFT JOIN tracks t ON t.id = co.track_id
          WHERE c.user_id = ${user.id}
          ORDER BY c.issued_at DESC;
        `,
        getCohortIdsForUser(user.id, user.role),
      ]);

    const eventsRes =
      cohortIds.length > 0
        ? await sql`
            WITH live AS (
              SELECT lc.id, lc.scheduled_at, lc.google_meet_link, w.title AS week_title, c.name AS cohort_name
              FROM live_classes lc
              JOIN weeks w ON w.id = lc.week_id
              JOIN cohorts c ON c.id = lc.cohort_id
              WHERE lc.cohort_id = ANY(${cohortIds})
            ),
            assign AS (
              SELECT a.id, a.deadline_at, a.title, c.name AS cohort_name
              FROM assignments a
              JOIN cohorts c ON c.id = a.cohort_id
              WHERE a.cohort_id = ANY(${cohortIds})
            ),
            office AS (
              SELECT s.id, s.start_time, s.end_time, s.title, s.meeting_link, s.cohort_id, c.name AS cohort_name
              FROM office_hour_bookings b
              JOIN office_hour_slots s ON s.id = b.slot_id
              LEFT JOIN cohorts c ON c.id = s.cohort_id
              WHERE b.student_id = ${user.id} AND b.status = 'booked' AND s.is_cancelled = false
            )
            SELECT 'live' AS type, id::text, scheduled_at AS start_at, scheduled_at AS end_at, week_title AS title, google_meet_link AS url, cohort_name FROM live
            UNION ALL
            SELECT 'assignment', id::text, deadline_at, deadline_at, title, NULL, cohort_name FROM assign
            UNION ALL
            SELECT 'office_hours', id::text, start_time, end_time, title, meeting_link, cohort_name FROM office
          `
        : { rows: [] };

    const portfolio = portfolioRes.rows[0] || null;
    const profileRow = profileRes.rows[0] || null;

    const data = {
      profile: profileRow
        ? {
            id: profileRow.id,
            email: profileRow.email,
            firstName: profileRow.first_name ?? '',
            lastName: profileRow.last_name ?? '',
            phone: profileRow.phone ?? '',
            address: profileRow.address ?? '',
            yearsExperience: profileRow.years_experience ?? null,
            role: profileRow.role,
            timezone: profileRow.timezone ?? null,
            languagePreference: profileRow.language_preference ?? 'en',
            createdAt: profileRow.created_at,
            lastLoginAt: profileRow.last_login_at,
          }
        : null,
      submissions: submissionsRes.rows,
      portfolio: portfolio
        ? {
            id: portfolio.id,
            slug: portfolio.slug,
            headline: portfolio.headline,
            bio: portfolio.bio,
            resumeUrl: portfolio.resume_url,
            isPublic: portfolio.is_public,
            customDomain: portfolio.custom_domain,
            projects: projectsRes.rows,
            socialLinks: socialLinksRes.rows,
          }
        : null,
      certificates: certsRes.rows,
      events: eventsRes.rows,
    };

    return NextResponse.json(data);
  } catch (e) {
    reportError(e, { route: 'GET /api/auth/export-my-data' });
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
