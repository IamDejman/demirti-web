import { sql } from '@vercel/postgres';
import { ensureLmsSchema, enrollStudentInCohort } from '@/lib/db-lms';
import { getUserByEmail, createUser } from '@/lib/auth';

export async function enrollPaidApplicant({ email, firstName, lastName, trackName, applicationId }) {
  if (!email || !trackName) {
    return { enrolled: false, reason: 'Missing email or trackName' };
  }

  await ensureLmsSchema();

  const trackResult = await sql`
    SELECT id FROM tracks WHERE LOWER(track_name) = LOWER(${trackName}) LIMIT 1;
  `;
  const track = trackResult.rows[0];
  if (!track) {
    return { enrolled: false, reason: 'Track not found' };
  }

  const cohortResult = await sql`
    SELECT * FROM cohorts
    WHERE track_id = ${track.id} AND status IN ('active', 'upcoming')
    ORDER BY start_date DESC
    LIMIT 1;
  `;
  const cohort = cohortResult.rows[0];
  if (!cohort) {
    return { enrolled: false, reason: 'No active/upcoming cohort' };
  }

  let user = await getUserByEmail(email);
  if (!user) {
    user = await createUser({
      email: email.trim(),
      password: null,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      role: 'student',
    });
  }

  const enrollment = await enrollStudentInCohort(cohort.id, user.id, applicationId || null);
  return { enrolled: true, cohortId: cohort.id, userId: user.id, enrollment };
}
