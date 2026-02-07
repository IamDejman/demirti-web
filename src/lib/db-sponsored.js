/**
 * Sponsored application database functions (essay-based cohort, no payment).
 * Extracted from db.js for maintainability.
 */

import { sql } from '@vercel/postgres';
import { ensureDatabaseInitialized } from './db';
import { DEFAULT_SPONSORED_COHORT } from './config';

export async function saveSponsoredApplication(application) {
  await ensureDatabaseInitialized();
  const applicationId = `SP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const result = await sql`
    INSERT INTO sponsored_applications (
      application_id, first_name, last_name, email, phone,
      linkedin_url, city, occupation, essay, ack_linkedin_48h, ack_commitment,
      cohort_name
    ) VALUES (
      ${applicationId},
      ${application.firstName},
      ${application.lastName},
      ${application.email},
      ${application.phone},
      ${application.linkedinUrl || null},
      ${application.city || null},
      ${application.occupation || null},
      ${application.essay},
      ${application.ackLinkedin48h ?? false},
      ${application.ackCommitment ?? false},
      ${application.cohortName || DEFAULT_SPONSORED_COHORT}
    )
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getAllSponsoredApplications(filters = {}) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM sponsored_applications
    ORDER BY created_at DESC
  `;
  let rows = result.rows;
  if (filters.reviewStatus) {
    rows = rows.filter((r) => r.review_status === filters.reviewStatus);
  }
  if (filters.cohortName) {
    rows = rows.filter((r) => r.cohort_name === filters.cohortName);
  }
  return rows;
}

export async function getSponsoredApplicationById(id) {
  await ensureDatabaseInitialized();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const result = await sql`
    SELECT * FROM sponsored_applications WHERE id = ${numId} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function getSponsoredApplicationByEmail(email) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM sponsored_applications
    WHERE email = ${email} AND review_status = 'accepted' AND confirmed_at IS NULL
    ORDER BY accepted_at DESC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function updateSponsoredApplicationReviewStatus(id, reviewStatus) {
  await ensureDatabaseInitialized();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  if (reviewStatus === 'accepted') {
    const result = await sql`
      UPDATE sponsored_applications
      SET review_status = 'accepted', accepted_at = CURRENT_TIMESTAMP
      WHERE id = ${numId}
      RETURNING *;
    `;
    return result.rows[0] || null;
  }
  const result = await sql`
    UPDATE sponsored_applications
    SET review_status = ${reviewStatus}, accepted_at = NULL
    WHERE id = ${numId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function updateSponsoredApplicationConfirmation(id, linkedinPostUrl) {
  await ensureDatabaseInitialized();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const result = await sql`
    UPDATE sponsored_applications
    SET linkedin_post_url = ${linkedinPostUrl}, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ${numId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function updateSponsoredApplicationConfirmationByEmail(email, linkedinPostUrl) {
  await ensureDatabaseInitialized();
  const result = await sql`
    UPDATE sponsored_applications
    SET linkedin_post_url = ${linkedinPostUrl}, confirmed_at = CURRENT_TIMESTAMP
    WHERE email = ${email} AND review_status = 'accepted' AND confirmed_at IS NULL
      AND accepted_at > (CURRENT_TIMESTAMP - INTERVAL '48 hours')
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function markSponsoredApplicationForfeited(id) {
  await ensureDatabaseInitialized();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const result = await sql`
    UPDATE sponsored_applications
    SET forfeited_at = CURRENT_TIMESTAMP
    WHERE id = ${numId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function getNextWaitlistApplicant(cohortName = DEFAULT_SPONSORED_COHORT) {
  await ensureDatabaseInitialized();
  const result = await sql`
    SELECT * FROM sponsored_applications
    WHERE review_status = 'waitlist' AND cohort_name = ${cohortName}
    ORDER BY created_at ASC
    LIMIT 1;
  `;
  return result.rows[0] || null;
}
