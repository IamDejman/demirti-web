/**
 * LMS schema and queries for CVERSE Academy.
 * Uses raw SQL with @vercel/postgres; run initializeLmsSchema() once to create tables.
 */

import { sql } from '@vercel/postgres';
import { ensureDatabaseInitialized } from './db';

let lmsInitialized = false;
let lmsInitPromise = null;

/** Ensure base DB is up, then run LMS schema if needed */
export async function ensureLmsSchema() {
  await ensureDatabaseInitialized();
  if (lmsInitialized) return;
  if (lmsInitPromise) return lmsInitPromise;
  lmsInitPromise = (async () => {
    try {
      const hasUsers = await sql`
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');
      `;
      if (!hasUsers.rows[0].exists) {
        await initializeLmsSchema();
      }
      lmsInitialized = true;
    } catch (e) {
      console.error('LMS schema init error:', e);
      throw e;
    } finally {
      lmsInitPromise = null;
    }
  })();
  return lmsInitPromise;
}

/** Create all LMS tables and extend tracks. Safe to run multiple times for new tables. */
export async function initializeLmsSchema() {
  await ensureDatabaseInitialized();

  // Enable UUID extension if not present (Vercel Postgres / Neon typically have it)
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.catch(() => {});

  // --- Enums (create type if not exists via DO block) ---
  await sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('guest', 'student', 'facilitator', 'alumni', 'admin');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE cohort_status AS ENUM ('upcoming', 'active', 'completed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE cohort_student_status AS ENUM ('active', 'completed', 'dropped', 'deferred');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE submission_status AS ENUM ('submitted', 'graded');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE live_class_status AS ENUM ('scheduled', 'in_progress', 'completed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE content_item_type AS ENUM ('pdf', 'slides', 'video_embed', 'document', 'link', 'recording');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE material_type AS ENUM ('book', 'software', 'starter_file', 'resource');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE assignment_submission_type AS ENUM ('file_upload', 'link', 'text', 'multiple');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // --- Extend tracks (add LMS columns) ---
  await sql`
    ALTER TABLE tracks ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
  `.catch(() => {});
  await sql`
    ALTER TABLE tracks ADD COLUMN IF NOT EXISTS description TEXT;
  `.catch(() => {});
  await sql`
    ALTER TABLE tracks ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 12;
  `.catch(() => {});
  await sql`
    ALTER TABLE tracks ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
  `.catch(() => {});

  // --- users ---
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      role user_role NOT NULL DEFAULT 'guest',
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      profile_picture_url VARCHAR(500),
      bio TEXT,
      phone VARCHAR(50),
      timezone VARCHAR(100),
      language_preference VARCHAR(20) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      referral_code VARCHAR(50) UNIQUE,
      referred_by_user_id UUID REFERENCES users(id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);`.catch(() => {});

  // --- user_social_links ---
  await sql`
    CREATE TABLE IF NOT EXISTS user_social_links (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform VARCHAR(50) NOT NULL,
      url VARCHAR(500) NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_social_links_user_id ON user_social_links(user_id);`.catch(() => {});

  // --- user_sessions (for LMS login: student, facilitator, admin via users) ---
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);`.catch(() => {});

  // --- cohorts (track_id references existing tracks.id which is SERIAL) ---
  await sql`
    CREATE TABLE IF NOT EXISTS cohorts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      current_week INTEGER DEFAULT 1,
      status cohort_status NOT NULL DEFAULT 'upcoming',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cohorts_track_id ON cohorts(track_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);`.catch(() => {});

  // --- cohort_facilitators ---
  await sql`
    CREATE TABLE IF NOT EXISTS cohort_facilitators (
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      facilitator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (cohort_id, facilitator_id)
    );
  `;

  // --- cohort_students ---
  await sql`
    CREATE TABLE IF NOT EXISTS cohort_students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status cohort_student_status NOT NULL DEFAULT 'active',
      completed_at TIMESTAMP,
      certificate_issued BOOLEAN DEFAULT false,
      certificate_url VARCHAR(500),
      application_id VARCHAR(255),
      UNIQUE(cohort_id, student_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cohort_students_cohort_id ON cohort_students(cohort_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_cohort_students_student_id ON cohort_students(student_id);`.catch(() => {});

  // --- weeks ---
  await sql`
    CREATE TABLE IF NOT EXISTS weeks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      unlock_date TIMESTAMP,
      live_class_datetime TIMESTAMP,
      google_meet_link VARCHAR(500),
      is_locked BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cohort_id, week_number)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_weeks_cohort_id ON weeks(cohort_id);`.catch(() => {});

  // --- weekly_checklist_items ---
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_checklist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      order_index INTEGER DEFAULT 0,
      is_required BOOLEAN DEFAULT true
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_weekly_checklist_items_week_id ON weekly_checklist_items(week_id);`.catch(() => {});

  // --- student_checklist_progress ---
  await sql`
    CREATE TABLE IF NOT EXISTS student_checklist_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checklist_item_id UUID NOT NULL REFERENCES weekly_checklist_items(id) ON DELETE CASCADE,
      completed_at TIMESTAMP,
      UNIQUE(student_id, checklist_item_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_student_checklist_progress_student_id ON student_checklist_progress(student_id);`.catch(() => {});

  // --- content_items ---
  await sql`
    CREATE TABLE IF NOT EXISTS content_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      type content_item_type NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_url VARCHAR(500),
      external_url VARCHAR(500),
      order_index INTEGER DEFAULT 0,
      is_downloadable BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_content_items_week_id ON content_items(week_id);`.catch(() => {});

  // --- materials ---
  await sql`
    CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      type material_type NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      url VARCHAR(500),
      file_url VARCHAR(500)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_materials_week_id ON materials(week_id);`.catch(() => {});

  // --- assignments ---
  await sql`
    CREATE TABLE IF NOT EXISTS assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      submission_type assignment_submission_type NOT NULL,
      allowed_file_types TEXT[],
      max_file_size_mb INTEGER,
      deadline_at TIMESTAMP NOT NULL,
      max_score INTEGER NOT NULL DEFAULT 100,
      is_published BOOLEAN DEFAULT false,
      publish_at TIMESTAMP,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_assignments_cohort_id ON assignments(cohort_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_assignments_week_id ON assignments(week_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_assignments_deadline_at ON assignments(deadline_at);`.catch(() => {});

  // --- assignment_submissions ---
  await sql`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      submission_type VARCHAR(50),
      file_url VARCHAR(500),
      link_url VARCHAR(500),
      text_content TEXT,
      status submission_status NOT NULL DEFAULT 'submitted',
      score INTEGER,
      feedback TEXT,
      graded_by UUID REFERENCES users(id),
      graded_at TIMESTAMP,
      UNIQUE(assignment_id, student_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);`.catch(() => {});

  // --- live_classes ---
  await sql`
    CREATE TABLE IF NOT EXISTS live_classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
      scheduled_at TIMESTAMP NOT NULL,
      google_meet_link VARCHAR(500),
      recording_url VARCHAR(500),
      status live_class_status NOT NULL DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_live_classes_cohort_id ON live_classes(cohort_id);`.catch(() => {});

  // --- attendance_records ---
  await sql`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      join_clicked_at TIMESTAMP,
      confirmed_by_facilitator BOOLEAN DEFAULT false,
      status attendance_status DEFAULT 'absent',
      marked_by UUID REFERENCES users(id),
      marked_at TIMESTAMP,
      UNIQUE(live_class_id, student_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_records_live_class_id ON attendance_records(live_class_id);`.catch(() => {});

  console.log('LMS schema initialized');
}

// --- Helper: generate referral code ---
export function generateReferralCode() {
  return Math.random().toString(36).slice(2, 10);
}

// --- Tracks (LMS columns) ---
export async function getTracksLms(activeOnly = true) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT id, track_name, course_price, scholarship_limit, scholarship_discount_percentage,
           slug, description, duration_weeks, thumbnail_url, is_active, created_at, updated_at
    FROM tracks
    ${activeOnly ? sql`WHERE is_active = true` : sql``}
    ORDER BY track_name;
  `;
  return result.rows;
}

export async function getTrackByIdLms(id) {
  await ensureLmsSchema();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const result = await sql`
    SELECT id, track_name, course_price, scholarship_limit, scholarship_discount_percentage,
           slug, description, duration_weeks, thumbnail_url, is_active, created_at, updated_at
    FROM tracks WHERE id = ${numId} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function getTrackBySlugLms(slug) {
  await ensureLmsSchema();
  if (!slug) return null;
  const result = await sql`
    SELECT id, track_name, course_price, scholarship_limit, scholarship_discount_percentage,
           slug, description, duration_weeks, thumbnail_url, is_active, created_at, updated_at
    FROM tracks WHERE slug = ${slug} AND is_active = true LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createTrackLms({ trackName, coursePrice, slug, description, durationWeeks, thumbnailUrl, scholarshipLimit, scholarshipDiscountPercentage }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO tracks (track_name, course_price, slug, description, duration_weeks, thumbnail_url, scholarship_limit, scholarship_discount_percentage, is_active)
    VALUES (${trackName}, ${coursePrice ?? 0}, ${slug ?? null}, ${description ?? null}, ${durationWeeks ?? 12}, ${thumbnailUrl ?? null}, ${scholarshipLimit ?? 10}, ${scholarshipDiscountPercentage ?? 50}, true)
    RETURNING *;
  `;
  return result.rows[0];
}

export async function updateTrackLms(id, updates) {
  await ensureLmsSchema();
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const { slug, description, durationWeeks, thumbnailUrl, trackName, isActive } = updates;
  const sets = [];
  if (slug !== undefined) sets.push(sql`slug = ${slug}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);
  if (durationWeeks !== undefined) sets.push(sql`duration_weeks = ${durationWeeks}`);
  if (thumbnailUrl !== undefined) sets.push(sql`thumbnail_url = ${thumbnailUrl}`);
  if (trackName !== undefined) sets.push(sql`track_name = ${trackName}`);
  if (isActive !== undefined) sets.push(sql`is_active = ${isActive}`);
  if (sets.length === 0) return await getTrackByIdLms(numId);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE tracks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${numId}`;
  return getTrackByIdLms(numId);
}

// --- Cohorts ---
export async function createCohort({ trackId, name, startDate, endDate, status = 'upcoming' }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO cohorts (track_id, name, start_date, end_date, status)
    VALUES (${trackId}, ${name}, ${startDate}, ${endDate}, ${status})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getCohorts(filters = {}) {
  await ensureLmsSchema();
  let query = sql`
    SELECT c.*, t.track_name, t.slug AS track_slug
    FROM cohorts c
    JOIN tracks t ON t.id = c.track_id
    WHERE 1=1
  `;
  if (filters.trackId != null) query = sql`${query} AND c.track_id = ${filters.trackId}`;
  if (filters.status) query = sql`${query} AND c.status = ${filters.status}`;
  query = sql`${query} ORDER BY c.start_date DESC`;
  const result = await query;
  return result.rows;
}

export async function getCohortById(id) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT c.*, t.track_name, t.slug AS track_slug, t.duration_weeks
    FROM cohorts c
    JOIN tracks t ON t.id = c.track_id
    WHERE c.id = ${id} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function updateCohort(id, updates) {
  await ensureLmsSchema();
  const { name, startDate, endDate, currentWeek, status } = updates;
  const sets = [];
  if (name !== undefined) sets.push(sql`name = ${name}`);
  if (startDate !== undefined) sets.push(sql`start_date = ${startDate}`);
  if (endDate !== undefined) sets.push(sql`end_date = ${endDate}`);
  if (currentWeek !== undefined) sets.push(sql`current_week = ${currentWeek}`);
  if (status !== undefined) sets.push(sql`status = ${status}`);
  if (sets.length === 0) return await getCohortById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE cohorts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  return getCohortById(id);
}

export async function getCohortFacilitators(cohortId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT u.id, u.email, u.first_name, u.last_name, cf.assigned_at
    FROM cohort_facilitators cf
    JOIN users u ON u.id = cf.facilitator_id
    WHERE cf.cohort_id = ${cohortId};
  `;
  return result.rows;
}

export async function addCohortFacilitator(cohortId, facilitatorId) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO cohort_facilitators (cohort_id, facilitator_id)
    VALUES (${cohortId}, ${facilitatorId})
    ON CONFLICT (cohort_id, facilitator_id) DO NOTHING;
  `;
  return getCohortFacilitators(cohortId);
}

export async function removeCohortFacilitator(cohortId, facilitatorId) {
  await ensureLmsSchema();
  await sql`
    DELETE FROM cohort_facilitators WHERE cohort_id = ${cohortId} AND facilitator_id = ${facilitatorId};
  `;
}

export async function getCohortStudents(cohortId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT cs.*, u.email, u.first_name, u.last_name
    FROM cohort_students cs
    JOIN users u ON u.id = cs.student_id
    WHERE cs.cohort_id = ${cohortId}
    ORDER BY cs.enrolled_at DESC;
  `;
  return result.rows;
}

export async function enrollStudentInCohort(cohortId, studentId, applicationId = null) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO cohort_students (cohort_id, student_id, application_id)
    VALUES (${cohortId}, ${studentId}, ${applicationId})
    ON CONFLICT (cohort_id, student_id) DO UPDATE SET application_id = COALESCE(EXCLUDED.application_id, cohort_students.application_id)
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getCohortProgress(cohortId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT cs.student_id, cs.status, cs.completed_at,
           (SELECT COUNT(*) FROM weeks w WHERE w.cohort_id = c.id) AS total_weeks,
           (SELECT COUNT(*) FROM student_checklist_progress scp
            JOIN weekly_checklist_items wci ON wci.id = scp.checklist_item_id
            JOIN weeks w2 ON w2.id = wci.week_id AND w2.cohort_id = c.id
            WHERE scp.student_id = cs.student_id AND scp.completed_at IS NOT NULL) AS completed_checklist_items
    FROM cohort_students cs
    JOIN cohorts c ON c.id = cs.cohort_id
    WHERE cs.cohort_id = ${cohortId};
  `;
  return result.rows;
}

export async function getCohortsForUser(userId, role) {
  await ensureLmsSchema();
  if (role === 'admin') {
    return getCohorts({});
  }
  if (role === 'facilitator') {
    const result = await sql`
      SELECT c.*, t.track_name, t.slug AS track_slug
      FROM cohorts c
      JOIN tracks t ON t.id = c.track_id
      JOIN cohort_facilitators cf ON cf.cohort_id = c.id AND cf.facilitator_id = ${userId}
      ORDER BY c.start_date DESC;
    `;
    return result.rows;
  }
  if (role === 'student' || role === 'alumni') {
    const result = await sql`
      SELECT c.*, t.track_name, t.slug AS track_slug, cs.status AS enrollment_status, cs.enrolled_at
      FROM cohorts c
      JOIN tracks t ON t.id = c.track_id
      JOIN cohort_students cs ON cs.cohort_id = c.id AND cs.student_id = ${userId}
      ORDER BY c.start_date DESC;
    `;
    return result.rows;
  }
  return [];
}

// --- Weeks ---
export async function getWeeksByCohort(cohortId, options = {}) {
  await ensureLmsSchema();
  const { forStudent = false } = options;
  if (forStudent) {
    const result = await sql`
      SELECT * FROM weeks
      WHERE cohort_id = ${cohortId}
      AND (is_locked = false OR (unlock_date IS NOT NULL AND unlock_date <= CURRENT_TIMESTAMP))
      ORDER BY week_number ASC;
    `;
    return result.rows;
  }
  const result = await sql`
    SELECT * FROM weeks WHERE cohort_id = ${cohortId} ORDER BY week_number ASC;
  `;
  return result.rows;
}

export async function getWeekById(id) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM weeks WHERE id = ${id} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createWeek({ cohortId, weekNumber, title, description, unlockDate, liveClassDatetime, googleMeetLink, isLocked = true }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO weeks (cohort_id, week_number, title, description, unlock_date, live_class_datetime, google_meet_link, is_locked)
    VALUES (${cohortId}, ${weekNumber}, ${title || null}, ${description || null}, ${unlockDate || null}, ${liveClassDatetime || null}, ${googleMeetLink || null}, ${isLocked ?? true})
    ON CONFLICT (cohort_id, week_number) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      unlock_date = EXCLUDED.unlock_date,
      live_class_datetime = EXCLUDED.live_class_datetime,
      google_meet_link = EXCLUDED.google_meet_link,
      is_locked = EXCLUDED.is_locked,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  return result.rows[0];
}

export async function updateWeek(id, updates) {
  await ensureLmsSchema();
  const { title, description, unlockDate, liveClassDatetime, googleMeetLink, isLocked, weekNumber } = updates;
  const sets = [];
  if (title !== undefined) sets.push(sql`title = ${title}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);
  if (unlockDate !== undefined) sets.push(sql`unlock_date = ${unlockDate}`);
  if (liveClassDatetime !== undefined) sets.push(sql`live_class_datetime = ${liveClassDatetime}`);
  if (googleMeetLink !== undefined) sets.push(sql`google_meet_link = ${googleMeetLink}`);
  if (isLocked !== undefined) sets.push(sql`is_locked = ${isLocked}`);
  if (weekNumber !== undefined) sets.push(sql`week_number = ${weekNumber}`);
  if (sets.length === 0) return await getWeekById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE weeks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  return getWeekById(id);
}

// --- Content items ---
export async function getContentItemsByWeek(weekId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM content_items WHERE week_id = ${weekId} ORDER BY order_index ASC, created_at ASC;
  `;
  return result.rows;
}

export async function createContentItem({ weekId, type, title, description, fileUrl, externalUrl, orderIndex, isDownloadable = false }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO content_items (week_id, type, title, description, file_url, external_url, order_index, is_downloadable)
    VALUES (${weekId}, ${type}, ${title}, ${description || null}, ${fileUrl || null}, ${externalUrl || null}, ${orderIndex ?? 0}, ${isDownloadable})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getContentItemById(id) {
  await ensureLmsSchema();
  const result = await sql`SELECT * FROM content_items WHERE id = ${id} LIMIT 1;`;
  return result.rows[0] || null;
}

export async function updateContentItem(id, updates) {
  await ensureLmsSchema();
  const { title, description, fileUrl, externalUrl, orderIndex, isDownloadable } = updates;
  const sets = [];
  if (title !== undefined) sets.push(sql`title = ${title}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);
  if (fileUrl !== undefined) sets.push(sql`file_url = ${fileUrl}`);
  if (externalUrl !== undefined) sets.push(sql`external_url = ${externalUrl}`);
  if (orderIndex !== undefined) sets.push(sql`order_index = ${orderIndex}`);
  if (isDownloadable !== undefined) sets.push(sql`is_downloadable = ${isDownloadable}`);
  if (sets.length === 0) return await getContentItemById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE content_items SET ${setClause} WHERE id = ${id}`;
  return getContentItemById(id);
}

export async function deleteContentItem(id) {
  await ensureLmsSchema();
  await sql`DELETE FROM content_items WHERE id = ${id}`;
  return true;
}

// --- Materials ---
export async function getMaterialsByWeek(weekId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM materials WHERE week_id = ${weekId} ORDER BY title;
  `;
  return result.rows;
}

export async function createMaterial({ weekId, type, title, description, url, fileUrl }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO materials (week_id, type, title, description, url, file_url)
    VALUES (${weekId}, ${type}, ${title}, ${description || null}, ${url || null}, ${fileUrl || null})
    RETURNING *;
  `;
  return result.rows[0];
}

// --- Weekly checklist ---
export async function getChecklistItemsByWeek(weekId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM weekly_checklist_items WHERE week_id = ${weekId} ORDER BY order_index ASC, id;
  `;
  return result.rows;
}

export async function createChecklistItem({ weekId, title, orderIndex, isRequired = true }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO weekly_checklist_items (week_id, title, order_index, is_required)
    VALUES (${weekId}, ${title}, ${orderIndex ?? 0}, ${isRequired})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function completeChecklistItem(studentId, checklistItemId) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO student_checklist_progress (student_id, checklist_item_id, completed_at)
    VALUES (${studentId}, ${checklistItemId}, CURRENT_TIMESTAMP)
    ON CONFLICT (student_id, checklist_item_id) DO UPDATE SET completed_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  return true;
}

export async function getStudentChecklistProgress(studentId, weekId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT wci.id, wci.title, wci.is_required, scp.completed_at
    FROM weekly_checklist_items wci
    LEFT JOIN student_checklist_progress scp ON scp.checklist_item_id = wci.id AND scp.student_id = ${studentId}
    WHERE wci.week_id = ${weekId}
    ORDER BY wci.order_index ASC, wci.id;
  `;
  return result.rows;
}

// --- Assignments ---
export async function getAssignmentsByCohort(cohortId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT a.*, w.week_number, w.title AS week_title
    FROM assignments a
    JOIN weeks w ON w.id = a.week_id
    WHERE a.cohort_id = ${cohortId}
    ORDER BY w.week_number ASC, a.deadline_at ASC;
  `;
  return result.rows;
}

export async function getAssignmentById(id) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT a.*, w.week_number, w.title AS week_title, w.cohort_id
    FROM assignments a
    JOIN weeks w ON w.id = a.week_id
    WHERE a.id = ${id} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createAssignment({
  weekId,
  cohortId,
  title,
  description,
  submissionType,
  allowedFileTypes,
  maxFileSizeMb,
  deadlineAt,
  maxScore,
  isPublished,
  publishAt,
  createdBy,
}) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO assignments (week_id, cohort_id, title, description, submission_type, allowed_file_types, max_file_size_mb, deadline_at, max_score, is_published, publish_at, created_by)
    VALUES (${weekId}, ${cohortId}, ${title}, ${description || null}, ${submissionType}, ${allowedFileTypes || null}, ${maxFileSizeMb ?? null}, ${deadlineAt}, ${maxScore ?? 100}, ${isPublished ?? false}, ${publishAt || null}, ${createdBy || null})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function updateAssignment(id, updates) {
  await ensureLmsSchema();
  const { title, description, deadlineAt, maxScore, isPublished, publishAt } = updates;
  const sets = [];
  if (title !== undefined) sets.push(sql`title = ${title}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);
  if (deadlineAt !== undefined) sets.push(sql`deadline_at = ${deadlineAt}`);
  if (maxScore !== undefined) sets.push(sql`max_score = ${maxScore}`);
  if (isPublished !== undefined) sets.push(sql`is_published = ${isPublished}`);
  if (publishAt !== undefined) sets.push(sql`publish_at = ${publishAt}`);
  if (sets.length === 0) return await getAssignmentById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE assignments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  return getAssignmentById(id);
}

// --- Submissions ---
export async function getSubmissionsByAssignment(assignmentId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT s.*, u.first_name, u.last_name, u.email
    FROM assignment_submissions s
    JOIN users u ON u.id = s.student_id
    WHERE s.assignment_id = ${assignmentId}
    ORDER BY s.submitted_at DESC;
  `;
  return result.rows;
}

export async function getSubmissionById(id) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT s.*, u.first_name, u.last_name, u.email
    FROM assignment_submissions s
    JOIN users u ON u.id = s.student_id
    WHERE s.id = ${id} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function getSubmissionByAssignmentAndStudent(assignmentId, studentId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM assignment_submissions
    WHERE assignment_id = ${assignmentId} AND student_id = ${studentId} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createSubmission({ assignmentId, studentId, submissionType, fileUrl, linkUrl, textContent }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO assignment_submissions (assignment_id, student_id, submission_type, file_url, link_url, text_content, status)
    VALUES (${assignmentId}, ${studentId}, ${submissionType || null}, ${fileUrl || null}, ${linkUrl || null}, ${textContent || null}, 'submitted')
    ON CONFLICT (assignment_id, student_id) DO UPDATE SET
      submission_type = EXCLUDED.submission_type,
      file_url = EXCLUDED.file_url,
      link_url = EXCLUDED.link_url,
      text_content = EXCLUDED.text_content,
      submitted_at = CURRENT_TIMESTAMP,
      status = 'submitted',
      score = NULL,
      feedback = NULL,
      graded_by = NULL,
      graded_at = NULL
    RETURNING *;
  `;
  return result.rows[0];
}

export async function gradeSubmission(submissionId, { score, feedback, gradedBy }) {
  await ensureLmsSchema();
  await sql`
    UPDATE assignment_submissions
    SET score = ${score}, feedback = ${feedback || null}, graded_by = ${gradedBy}, graded_at = CURRENT_TIMESTAMP, status = 'graded'
    WHERE id = ${submissionId};
  `;
  return getSubmissionById(submissionId);
}

export async function getPendingSubmissionsForFacilitator(facilitatorId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT s.*, a.title AS assignment_title, a.deadline_at, a.max_score, u.first_name, u.last_name, u.email
    FROM assignment_submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN cohort_facilitators cf ON cf.cohort_id = a.cohort_id AND cf.facilitator_id = ${facilitatorId}
    JOIN users u ON u.id = s.student_id
    WHERE s.status = 'submitted'
    ORDER BY s.submitted_at ASC;
  `;
  return result.rows;
}

// --- Live classes ---
export async function getLiveClassById(id) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT lc.*, w.week_number, w.title AS week_title
    FROM live_classes lc
    JOIN weeks w ON w.id = lc.week_id
    WHERE lc.id = ${id} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function getLiveClassesByCohort(cohortId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT lc.*, w.week_number, w.title AS week_title
    FROM live_classes lc
    JOIN weeks w ON w.id = lc.week_id
    WHERE lc.cohort_id = ${cohortId}
    ORDER BY lc.scheduled_at ASC;
  `;
  return result.rows;
}

export async function getLiveClassByWeekId(weekId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT * FROM live_classes WHERE week_id = ${weekId} LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createLiveClass({ weekId, cohortId, scheduledAt, googleMeetLink }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO live_classes (week_id, cohort_id, scheduled_at, google_meet_link, status)
    VALUES (${weekId}, ${cohortId}, ${scheduledAt}, ${googleMeetLink || null}, 'scheduled')
    RETURNING *;
  `;
  return result.rows[0];
}

export async function updateLiveClass(id, updates) {
  await ensureLmsSchema();
  const { recordingUrl, status, googleMeetLink } = updates;
  const sets = [];
  if (recordingUrl !== undefined) sets.push(sql`recording_url = ${recordingUrl}`);
  if (status !== undefined) sets.push(sql`status = ${status}`);
  if (googleMeetLink !== undefined) sets.push(sql`google_meet_link = ${googleMeetLink}`);
  if (sets.length === 0) return await getLiveClassById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE live_classes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  return getLiveClassById(id);
}

// --- Attendance ---
export async function getAttendanceByLiveClass(liveClassId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT ar.*, u.first_name, u.last_name, u.email
    FROM attendance_records ar
    JOIN users u ON u.id = ar.student_id
    WHERE ar.live_class_id = ${liveClassId}
    ORDER BY ar.join_clicked_at DESC NULLS LAST, u.last_name;
  `;
  return result.rows;
}

export async function upsertAttendanceJoinClick(liveClassId, studentId) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO attendance_records (live_class_id, student_id, join_clicked_at, status)
    VALUES (${liveClassId}, ${studentId}, CURRENT_TIMESTAMP, 'absent')
    ON CONFLICT (live_class_id, student_id) DO UPDATE SET join_clicked_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  return true;
}

export async function ensureAttendanceRecordsForLiveClass(liveClassId, cohortId) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO attendance_records (live_class_id, student_id, status)
    SELECT ${liveClassId}, cs.student_id, 'absent'
    FROM cohort_students cs
    WHERE cs.cohort_id = ${cohortId} AND cs.status = 'active'
    ON CONFLICT (live_class_id, student_id) DO NOTHING;
  `;
}

export async function updateAttendanceStatus(liveClassId, studentId, status, markedBy) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO attendance_records (live_class_id, student_id, status, confirmed_by_facilitator, marked_by, marked_at)
    VALUES (${liveClassId}, ${studentId}, ${status}, true, ${markedBy}, CURRENT_TIMESTAMP)
    ON CONFLICT (live_class_id, student_id) DO UPDATE SET
      status = ${status},
      confirmed_by_facilitator = true,
      marked_by = ${markedBy},
      marked_at = CURRENT_TIMESTAMP;
  `;
  return true;
}

export async function bulkUpdateAttendance(liveClassId, updates, markedBy) {
  await ensureLmsSchema();
  for (const { studentId, status } of updates) {
    await updateAttendanceStatus(liveClassId, studentId, status, markedBy);
  }
  return getAttendanceByLiveClass(liveClassId);
}
