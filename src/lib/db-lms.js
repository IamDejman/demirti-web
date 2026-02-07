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
      const requiredTables = [
        'users',
        'announcements',
        'notifications',
        'notification_preferences',
        'chat_rooms',
        'jobs',
        'industry_professionals',
        'sample_projects',
        'portfolios',
        'portfolio_projects',
        'portfolio_social_links',
        'certificates',
        'ai_conversations',
        'ai_messages',
        'ai_usage_limits',
        'push_subscriptions',
        'audit_logs',
        'admin_impersonations',
        'course_templates',
        'notification_templates',
        'lms_events',
        'user_password_resets',
        'office_hour_slots',
        'office_hour_bookings',
        'job_applications',
        'ai_settings',
      ];
      const tableCheck = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY(${requiredTables});
      `;
      const existing = new Set(tableCheck.rows.map((r) => r.table_name));
      const hasAll = requiredTables.every((t) => existing.has(t));
      if (!hasAll) {
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
  await sql`
    DO $$ BEGIN
      CREATE TYPE announcement_scope AS ENUM ('system', 'track', 'cohort');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM ('announcement', 'assignment', 'grade', 'system');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;
  await sql`ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'chat';`.catch(() => {});
  await sql`
    DO $$ BEGIN
      CREATE TYPE chat_room_type AS ENUM ('cohort', 'dm', 'group');
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
      suspended_until TIMESTAMP,
      is_shadowbanned BOOLEAN DEFAULT false,
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

  // --- announcements ---
  await sql`
    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      scope announcement_scope NOT NULL DEFAULT 'system',
      track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
      cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
      is_published BOOLEAN DEFAULT true,
      publish_at TIMESTAMP,
      send_email BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP;`.catch(() => {});
  await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS send_email BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_track_id ON announcements(track_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_cohort_id ON announcements(cohort_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);`.catch(() => {});

  // --- notifications ---
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type notification_type NOT NULL DEFAULT 'system',
      title VARCHAR(255) NOT NULL,
      body TEXT,
      data JSONB,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`.catch(() => {});

  // --- notification_preferences ---
  await sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_enabled BOOLEAN DEFAULT true,
      in_app_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_announcements BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_chat BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_assignments BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_grades BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_deadlines BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS in_app_announcements BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS in_app_chat BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS in_app_assignments BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS in_app_grades BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS in_app_deadlines BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_announcements BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_chat BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_assignments BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_grades BOOLEAN DEFAULT true;`.catch(() => {});
  await sql`ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_deadlines BOOLEAN DEFAULT true;`.catch(() => {});

  // --- chat rooms ---
  await sql`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type chat_room_type NOT NULL DEFAULT 'cohort',
      title VARCHAR(255),
      cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id),
      last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_rooms_cohort_id ON chat_rooms(cohort_id);`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS chat_room_members (
      room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (room_id, user_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);`.catch(() => {});
  await sql`ALTER TABLE chat_room_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP;`.catch(() => {});
  await sql`ALTER TABLE chat_room_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;`.catch(() => {});
  await sql`ALTER TABLE chat_room_members ADD COLUMN IF NOT EXISTS email_muted BOOLEAN DEFAULT false;`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      is_shadowbanned BOOLEAN DEFAULT false,
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS message_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_message_reports_reported_by ON message_reports(reported_by);`.catch(() => {});
  await sql`ALTER TABLE message_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;`.catch(() => {});
  await sql`ALTER TABLE message_reports ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);`.catch(() => {});
  await sql`ALTER TABLE message_reports ADD COLUMN IF NOT EXISTS action VARCHAR(50);`.catch(() => {});
  await sql`ALTER TABLE message_reports ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT false;`.catch(() => {});

  // --- moderation_actions ---
  await sql`
    CREATE TABLE IF NOT EXISTS moderation_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      reason TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_moderation_actions_user_id ON moderation_actions(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);`.catch(() => {});

  // --- jobs ---
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      location VARCHAR(255),
      employment_type VARCHAR(100),
      salary_range VARCHAR(255),
      description TEXT,
      external_url VARCHAR(500),
      track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_jobs_track_id ON jobs(track_id);`.catch(() => {});

  // --- industry_professionals ---
  await sql`
    CREATE TABLE IF NOT EXISTS industry_professionals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      company VARCHAR(255),
      bio TEXT,
      photo_url VARCHAR(500),
      linkedin_url VARCHAR(500),
      track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_industry_professionals_active ON industry_professionals(is_active);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_industry_professionals_track_id ON industry_professionals(track_id);`.catch(() => {});

  // --- sample_projects ---
  await sql`
    CREATE TABLE IF NOT EXISTS sample_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
      tags TEXT[],
      thumbnail_url VARCHAR(500),
      external_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sample_projects_active ON sample_projects(is_active);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_sample_projects_track_id ON sample_projects(track_id);`.catch(() => {});

  // --- portfolios ---
  await sql`
    CREATE TABLE IF NOT EXISTS portfolios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug VARCHAR(255) UNIQUE,
      custom_domain VARCHAR(255),
      domain_verification_token VARCHAR(255),
      domain_verified_at TIMESTAMP,
      headline VARCHAR(255),
      bio TEXT,
      resume_url VARCHAR(500),
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON portfolios(slug);`.catch(() => {});

  // --- portfolio_projects ---
  await sql`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      link_url VARCHAR(500),
      image_url VARCHAR(500),
      order_index INTEGER DEFAULT 0
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_portfolio_projects_portfolio_id ON portfolio_projects(portfolio_id);`.catch(() => {});

  // --- portfolio_social_links ---
  await sql`
    CREATE TABLE IF NOT EXISTS portfolio_social_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      platform VARCHAR(50),
      url VARCHAR(500)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_portfolio_social_links_portfolio_id ON portfolio_social_links(portfolio_id);`.catch(() => {});

  // --- certificates ---
  await sql`
    CREATE TABLE IF NOT EXISTS certificates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
      certificate_number VARCHAR(100) UNIQUE NOT NULL,
      verification_code VARCHAR(100) UNIQUE,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      pdf_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_certificates_cohort_id ON certificates(cohort_id);`.catch(() => {});

  // --- office hours ---
  await sql`
    CREATE TABLE IF NOT EXISTS office_hour_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
      facilitator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      description TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      meeting_link VARCHAR(500),
      capacity INTEGER DEFAULT 1,
      is_cancelled BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_office_hours_facilitator ON office_hour_slots(facilitator_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_office_hours_start_time ON office_hour_slots(start_time);`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS office_hour_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_id UUID NOT NULL REFERENCES office_hour_slots(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'booked',
      booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(slot_id, student_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_office_hour_bookings_student ON office_hour_bookings(student_id);`.catch(() => {});

  // --- job applications ---
  await sql`
    CREATE TABLE IF NOT EXISTS job_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      resume_url VARCHAR(500),
      portfolio_url VARCHAR(500),
      cover_letter TEXT,
      status VARCHAR(30) DEFAULT 'submitted',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);`.catch(() => {});

  // --- AI settings ---
  await sql`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      system_prompt TEXT,
      daily_limit INTEGER DEFAULT 50,
      max_tokens INTEGER DEFAULT 700,
      blocked_phrases TEXT[]
    );
  `;

  // --- AI assistant ---
  await sql`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS ai_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);`.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS ai_usage_limits (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      usage_count INTEGER DEFAULT 0,
      usage_limit INTEGER DEFAULT 50
    );
  `;

  // --- push subscriptions ---
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);`.catch(() => {});

  // --- audit logs ---
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(100),
      target_id VARCHAR(100),
      details JSONB,
      ip_address VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`.catch(() => {});

  // --- admin impersonations ---
  await sql`
    CREATE TABLE IF NOT EXISTS admin_impersonations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_impersonations_admin_id ON admin_impersonations(admin_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_impersonations_user_id ON admin_impersonations(user_id);`.catch(() => {});

  // --- course templates ---
  await sql`
    CREATE TABLE IF NOT EXISTS course_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
      data JSONB,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_course_templates_track_id ON course_templates(track_id);`.catch(() => {});

  // --- notification templates ---
  await sql`
    CREATE TABLE IF NOT EXISTS notification_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_key VARCHAR(100) UNIQUE NOT NULL,
      title_template VARCHAR(255),
      body_template TEXT,
      email_enabled BOOLEAN DEFAULT true,
      in_app_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // --- lms_events ---
  await sql`
    CREATE TABLE IF NOT EXISTS lms_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(100) NOT NULL,
      properties JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_lms_events_user_id ON lms_events(user_id);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_lms_events_name ON lms_events(name);`.catch(() => {});
  await sql`CREATE INDEX IF NOT EXISTS idx_lms_events_created_at ON lms_events(created_at);`.catch(() => {});

  // User password reset (forgot-password OTP flow)
  await sql`
    CREATE TABLE IF NOT EXISTS user_password_resets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_password_resets_email_expires ON user_password_resets(email, expires_at);`.catch(() => {});

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

export async function getChecklistProgressForStudent(cohortId, studentId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT
      (SELECT COUNT(*) FROM weekly_checklist_items wci
        JOIN weeks w ON w.id = wci.week_id
        WHERE w.cohort_id = ${cohortId}) AS total_items,
      (SELECT COUNT(*) FROM student_checklist_progress scp
        JOIN weekly_checklist_items wci ON wci.id = scp.checklist_item_id
        JOIN weeks w ON w.id = wci.week_id
        WHERE w.cohort_id = ${cohortId}
          AND scp.student_id = ${studentId}
          AND scp.completed_at IS NOT NULL) AS completed_items;
  `;
  return result.rows[0] || { total_items: 0, completed_items: 0 };
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

export async function getMaterialById(id) {
  await ensureLmsSchema();
  const result = await sql`SELECT * FROM materials WHERE id = ${id} LIMIT 1;`;
  return result.rows[0] || null;
}

export async function updateMaterial(id, updates) {
  await ensureLmsSchema();
  const { title, description, url, fileUrl, type } = updates;
  const sets = [];
  if (title !== undefined) sets.push(sql`title = ${title}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);
  if (url !== undefined) sets.push(sql`url = ${url}`);
  if (fileUrl !== undefined) sets.push(sql`file_url = ${fileUrl}`);
  if (type !== undefined) sets.push(sql`type = ${type}`);
  if (sets.length === 0) return await getMaterialById(id);
  const setClause = sets.reduce((a, b) => (a ? sql`${a}, ${b}` : b), null);
  await sql`UPDATE materials SET ${setClause} WHERE id = ${id}`;
  return getMaterialById(id);
}

export async function deleteMaterial(id) {
  await ensureLmsSchema();
  await sql`DELETE FROM materials WHERE id = ${id}`;
  return true;
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

// --- Announcements & Notifications ---
export async function createAnnouncement({ title, body, scope = 'system', trackId = null, cohortId = null, createdBy = null, isPublished = true, publishAt = null, sendEmail = true }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO announcements (title, body, scope, track_id, cohort_id, created_by, is_published, publish_at, send_email)
    VALUES (${title}, ${body}, ${scope}, ${trackId}, ${cohortId}, ${createdBy}, ${isPublished}, ${publishAt}, ${sendEmail})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getAnnouncementsAll(limit = 100) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT a.*, t.track_name, c.name AS cohort_name
    FROM announcements a
    LEFT JOIN tracks t ON t.id = a.track_id
    LEFT JOIN cohorts c ON c.id = a.cohort_id
    ORDER BY a.created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function getCohortIdsForUser(userId, role) {
  await ensureLmsSchema();
  if (!userId) return [];
  if (role === 'admin') {
    const res = await sql`SELECT id FROM cohorts`;
    return res.rows.map((r) => r.id);
  }
  if (role === 'facilitator') {
    const res = await sql`SELECT cohort_id FROM cohort_facilitators WHERE facilitator_id = ${userId}`;
    return res.rows.map((r) => r.cohort_id);
  }
  if (role === 'student' || role === 'alumni') {
    const res = await sql`SELECT cohort_id FROM cohort_students WHERE student_id = ${userId}`;
    return res.rows.map((r) => r.cohort_id);
  }
  return [];
}

export async function getAnnouncementsForUser(userId, role, limit = 50) {
  await ensureLmsSchema();
  const cohortIds = await getCohortIdsForUser(userId, role);
  if (!cohortIds || cohortIds.length === 0) {
    const result = await sql`
      SELECT a.*, t.track_name, c.name AS cohort_name
      FROM announcements a
      LEFT JOIN tracks t ON t.id = a.track_id
      LEFT JOIN cohorts c ON c.id = a.cohort_id
      WHERE a.is_published = true
        AND (a.publish_at IS NULL OR a.publish_at <= CURRENT_TIMESTAMP)
        AND a.scope = 'system'
      ORDER BY a.created_at DESC
      LIMIT ${limit};
    `;
    return result.rows;
  }
  const result = await sql`
    SELECT a.*, t.track_name, c.name AS cohort_name
    FROM announcements a
    LEFT JOIN tracks t ON t.id = a.track_id
    LEFT JOIN cohorts c ON c.id = a.cohort_id
    WHERE a.is_published = true
      AND (a.publish_at IS NULL OR a.publish_at <= CURRENT_TIMESTAMP)
      AND (
        a.scope = 'system'
        OR (a.scope = 'track' AND a.track_id IN (
          SELECT DISTINCT track_id FROM cohorts WHERE id = ANY(${cohortIds})
        ))
        OR (a.scope = 'cohort' AND a.cohort_id = ANY(${cohortIds}))
      )
    ORDER BY a.created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function createAnnouncementNotifications(announcement) {
  await ensureLmsSchema();
  if (!announcement) return [];
  const { scope, track_id: trackId, cohort_id: cohortId, title, body } = announcement;
  let recipients = [];
  let trackName = null;
  let cohortName = null;
  if (trackId) {
    const t = await sql`SELECT track_name FROM tracks WHERE id = ${trackId} LIMIT 1;`;
    trackName = t.rows[0]?.track_name || null;
  }
  if (cohortId) {
    const c = await sql`SELECT name FROM cohorts WHERE id = ${cohortId} LIMIT 1;`;
    cohortName = c.rows[0]?.name || null;
  }
  const templateResult = await applyNotificationTemplate('announcement', title, body, {
    title,
    body,
    scope,
    trackName,
    cohortName,
  });
  const resolvedTitle = templateResult.title;
  const resolvedBody = templateResult.body;
  if (scope === 'system') {
    const res = await sql`
      SELECT id, email, first_name, last_name
      FROM users
      WHERE is_active = true;
    `;
    recipients = res.rows;
  } else if (scope === 'track' && trackId) {
    const res = await sql`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      JOIN cohort_students cs ON cs.student_id = u.id
      JOIN cohorts c ON c.id = cs.cohort_id
      WHERE c.track_id = ${trackId}
      UNION
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      JOIN cohort_facilitators cf ON cf.facilitator_id = u.id
      JOIN cohorts c ON c.id = cf.cohort_id
      WHERE c.track_id = ${trackId};
    `;
    recipients = res.rows;
  } else if (scope === 'cohort' && cohortId) {
    const res = await sql`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      JOIN cohort_students cs ON cs.student_id = u.id
      WHERE cs.cohort_id = ${cohortId}
      UNION
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      JOIN cohort_facilitators cf ON cf.facilitator_id = u.id
      WHERE cf.cohort_id = ${cohortId};
    `;
    recipients = res.rows;
  }

  if (recipients.length > 0) {
    const userIds = recipients.map((r) => r.id);
    const prefsRes = await sql`
      SELECT user_id, email_enabled, in_app_enabled,
             email_announcements, in_app_announcements, push_announcements
      FROM notification_preferences
      WHERE user_id = ANY(${userIds});
    `;
    const prefsMap = prefsRes.rows.reduce((acc, row) => {
      acc[row.user_id] = row;
      return acc;
    }, {});

    const inAppRecipients = recipients.filter((r) => {
      const pref = prefsMap[r.id];
      return templateResult.inAppEnabled !== false
        && (pref ? pref.in_app_enabled !== false : true)
        && (pref ? pref.in_app_announcements !== false : true);
    });
    const emailRecipients = recipients.filter((r) => {
      const pref = prefsMap[r.id];
      return templateResult.emailEnabled !== false
        && (pref ? pref.email_enabled !== false : true)
        && (pref ? pref.email_announcements !== false : true);
    });
    const pushRecipients = recipients.filter((r) => {
      const pref = prefsMap[r.id];
      return templateResult.inAppEnabled !== false
        && (pref ? pref.push_announcements !== false : true);
    });

    if (inAppRecipients.length > 0) {
      const inAppIds = inAppRecipients.map((r) => r.id);
      await sql`
        INSERT INTO notifications (user_id, type, title, body, data)
        SELECT id, 'announcement', ${resolvedTitle}, ${resolvedBody}, ${JSON.stringify({ announcementId: announcement.id })}
        FROM users
        WHERE id = ANY(${inAppIds});
      `;
    }
    return { recipients, inAppRecipients, emailRecipients, pushRecipients, title: resolvedTitle, body: resolvedBody, template: templateResult };
  }
  return { recipients: [], inAppRecipients: [], emailRecipients: [], pushRecipients: [], title: resolvedTitle, body: resolvedBody, template: templateResult };
}

export async function getChatRoomNotificationRecipients(roomId, senderId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT u.id, u.email, u.first_name, u.last_name,
           m.is_muted, m.email_muted, m.last_read_at,
           p.email_enabled, p.in_app_enabled, p.email_chat, p.in_app_chat, p.push_chat
    FROM chat_room_members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN notification_preferences p ON p.user_id = u.id
    WHERE m.room_id = ${roomId} AND m.user_id <> ${senderId};
  `;
  return result.rows;
}

export async function createChatNotifications({ title, body, roomId, recipientIds }) {
  await ensureLmsSchema();
  if (!recipientIds || recipientIds.length === 0) return;
  await sql`
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT id, 'chat', ${title}, ${body}, ${JSON.stringify({ roomId })}
    FROM users
    WHERE id = ANY(${recipientIds});
  `;
}

async function getCohortNotificationRecipients(cohortId) {
  if (!cohortId) return [];
  const res = await sql`
    SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
    FROM users u
    JOIN cohort_students cs ON cs.student_id = u.id
    WHERE cs.cohort_id = ${cohortId}
    UNION
    SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
    FROM users u
    JOIN cohort_facilitators cf ON cf.facilitator_id = u.id
    WHERE cf.cohort_id = ${cohortId};
  `;
  return res.rows;
}

export async function createAssignmentNotifications(assignment, eventKey = 'assignment_posted') {
  await ensureLmsSchema();
  if (!assignment) return { recipients: [], inAppRecipients: [], emailRecipients: [] };
  const cohortRes = await sql`SELECT name, track_id FROM cohorts WHERE id = ${assignment.cohort_id} LIMIT 1;`;
  const cohortName = cohortRes.rows[0]?.name || null;
  const trackId = cohortRes.rows[0]?.track_id || null;
  const trackRes = trackId ? await sql`SELECT track_name FROM tracks WHERE id = ${trackId} LIMIT 1;` : { rows: [] };
  const trackName = trackRes.rows[0]?.track_name || null;
  const templateResult = await applyNotificationTemplate(
    eventKey,
    assignment.title,
    assignment.description || '',
    {
      assignmentTitle: assignment.title,
      deadline: assignment.deadline_at,
      cohortName,
      trackName,
    }
  );
  const recipients = await getCohortNotificationRecipients(assignment.cohort_id);
  if (recipients.length === 0) {
    return { recipients: [], inAppRecipients: [], emailRecipients: [], title: templateResult.title, body: templateResult.body, template: templateResult };
  }
  const userIds = recipients.map((r) => r.id);
  const prefsRes = await sql`
    SELECT user_id, email_enabled, in_app_enabled,
           email_assignments, email_deadlines, in_app_assignments, in_app_deadlines,
           push_assignments, push_deadlines
    FROM notification_preferences
    WHERE user_id = ANY(${userIds});
  `;
  const prefsMap = prefsRes.rows.reduce((acc, row) => {
    acc[row.user_id] = row;
    return acc;
  }, {});
  const isDeadline = eventKey === 'assignment_deadline';
  const inAppRecipients = recipients.filter((r) => {
    const pref = prefsMap[r.id];
    const categoryOk = isDeadline ? (pref?.in_app_deadlines !== false) : (pref?.in_app_assignments !== false);
    return templateResult.inAppEnabled !== false && (pref ? pref.in_app_enabled !== false : true) && categoryOk;
  });
  const emailRecipients = recipients.filter((r) => {
    const pref = prefsMap[r.id];
    const categoryOk = isDeadline ? (pref?.email_deadlines !== false) : (pref?.email_assignments !== false);
    return templateResult.emailEnabled !== false && (pref ? pref.email_enabled !== false : true) && categoryOk;
  });
  const pushRecipients = recipients.filter((r) => {
    const pref = prefsMap[r.id];
    const categoryOk = isDeadline ? (pref?.push_deadlines !== false) : (pref?.push_assignments !== false);
    return templateResult.inAppEnabled !== false && categoryOk;
  });
  if (inAppRecipients.length > 0) {
    const inAppIds = inAppRecipients.map((r) => r.id);
    await sql`
      INSERT INTO notifications (user_id, type, title, body, data)
      SELECT id, 'assignment', ${templateResult.title}, ${templateResult.body}, ${JSON.stringify({ assignmentId: assignment.id })}
      FROM users
      WHERE id = ANY(${inAppIds});
    `;
  }
  return { recipients, inAppRecipients, emailRecipients, pushRecipients, title: templateResult.title, body: templateResult.body, template: templateResult };
}

export async function createGradeNotification({ assignment, studentId, score }) {
  await ensureLmsSchema();
  if (!assignment || !studentId) return null;
  const cohortRes = await sql`SELECT name, track_id FROM cohorts WHERE id = ${assignment.cohort_id} LIMIT 1;`;
  const cohortName = cohortRes.rows[0]?.name || null;
  const trackId = cohortRes.rows[0]?.track_id || null;
  const trackRes = trackId ? await sql`SELECT track_name FROM tracks WHERE id = ${trackId} LIMIT 1;` : { rows: [] };
  const trackName = trackRes.rows[0]?.track_name || null;
  const templateResult = await applyNotificationTemplate(
    'assignment_graded',
    `Graded: ${assignment.title}`,
    `Score: ${score}`,
    {
      assignmentTitle: assignment.title,
      score,
      cohortName,
      trackName,
    }
  );
  const prefsRes = await sql`
    SELECT user_id, email_enabled, in_app_enabled, email_grades, in_app_grades, push_grades
    FROM notification_preferences
    WHERE user_id = ${studentId}
    LIMIT 1;
  `;
  const prefs = prefsRes.rows[0] || { email_enabled: true, in_app_enabled: true };
  if (templateResult.inAppEnabled !== false && prefs.in_app_enabled !== false && prefs.in_app_grades !== false) {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (${studentId}, 'grade', ${templateResult.title}, ${templateResult.body}, ${JSON.stringify({ assignmentId: assignment.id, score })});
    `;
  }
  return {
    template: templateResult,
    emailEnabled: templateResult.emailEnabled !== false && prefs.email_enabled !== false && prefs.email_grades !== false,
    pushEnabled: templateResult.inAppEnabled !== false && prefs.push_grades !== false,
  };
}

export async function getNotificationTemplate(eventKey) {
  await ensureLmsSchema();
  if (!eventKey) return null;
  const res = await sql`
    SELECT * FROM notification_templates
    WHERE event_key = ${eventKey}
    LIMIT 1;
  `;
  return res.rows[0] || null;
}

function renderTemplateString(template, context) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = context[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

export async function applyNotificationTemplate(eventKey, fallbackTitle, fallbackBody, context = {}) {
  const template = await getNotificationTemplate(eventKey);
  if (!template) {
    return {
      title: fallbackTitle,
      body: fallbackBody,
      emailEnabled: true,
      inAppEnabled: true,
    };
  }
  const resolvedTitle = template.title_template
    ? renderTemplateString(template.title_template, context)
    : fallbackTitle;
  const resolvedBody = template.body_template
    ? renderTemplateString(template.body_template, context)
    : fallbackBody;
  return {
    title: resolvedTitle,
    body: resolvedBody,
    emailEnabled: template.email_enabled !== false,
    inAppEnabled: template.in_app_enabled !== false,
  };
}

export async function upsertPushSubscription(userId, { endpoint, p256dh, auth }) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${userId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth;
  `;
}

export async function deletePushSubscription(userId, endpoint) {
  await ensureLmsSchema();
  await sql`
    DELETE FROM push_subscriptions
    WHERE user_id = ${userId} AND endpoint = ${endpoint};
  `;
}

export async function getPushSubscriptionsForUsers(userIds) {
  await ensureLmsSchema();
  if (!userIds || userIds.length === 0) return [];
  const result = await sql`
    SELECT user_id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ANY(${userIds});
  `;
  return result.rows;
}

export async function recordLmsEvent(userId, name, properties = null) {
  await ensureLmsSchema();
  if (!name) return;
  await sql`
    INSERT INTO lms_events (user_id, name, properties)
    VALUES (${userId || null}, ${name}, ${properties ? JSON.stringify(properties) : null});
  `;
}

// --- User moderation ---
export async function setUserSuspension(userId, suspendedUntil = null) {
  await ensureLmsSchema();
  await sql`
    UPDATE users
    SET suspended_until = ${suspendedUntil},
        is_active = ${suspendedUntil ? false : true}
    WHERE id = ${userId};
  `;
}

export async function setUserShadowban(userId, isShadowbanned) {
  await ensureLmsSchema();
  await sql`
    UPDATE users
    SET is_shadowbanned = ${isShadowbanned}
    WHERE id = ${userId};
  `;
}

export async function setUserActiveStatus(userId, isActive) {
  await ensureLmsSchema();
  if (isActive) {
    await sql`
      UPDATE users
      SET is_active = true,
          suspended_until = null
      WHERE id = ${userId};
    `;
  } else {
    await sql`
      UPDATE users
      SET is_active = false,
          suspended_until = COALESCE(suspended_until, CURRENT_TIMESTAMP + INTERVAL '365 days')
      WHERE id = ${userId};
    `;
  }
}

export async function recordModerationAction({ userId, action, reason = null, createdBy = null }) {
  await ensureLmsSchema();
  if (!userId || !action) return null;
  const res = await sql`
    INSERT INTO moderation_actions (user_id, action, reason, created_by)
    VALUES (${userId}, ${action}, ${reason}, ${createdBy})
    RETURNING *;
  `;
  return res.rows[0] || null;
}

export async function getModerationActionsForUser(userId, limit = 20) {
  await ensureLmsSchema();
  if (!userId) return [];
  const res = await sql`
    SELECT ma.*, u.email AS actor_email
    FROM moderation_actions ma
    LEFT JOIN users u ON u.id = ma.created_by
    WHERE ma.user_id = ${userId}
    ORDER BY ma.created_at DESC
    LIMIT ${limit};
  `;
  return res.rows;
}

// --- Office hours ---
export async function createOfficeHourSlot({ cohortId, facilitatorId, title, description, startTime, endTime, meetingLink, capacity }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO office_hour_slots (cohort_id, facilitator_id, title, description, start_time, end_time, meeting_link, capacity)
    VALUES (${cohortId || null}, ${facilitatorId}, ${title || null}, ${description || null}, ${startTime}, ${endTime}, ${meetingLink || null}, ${capacity || 1})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getOfficeHourSlotsForFacilitator(facilitatorId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT s.*, c.name AS cohort_name
    FROM office_hour_slots s
    LEFT JOIN cohorts c ON c.id = s.cohort_id
    WHERE s.facilitator_id = ${facilitatorId}
    ORDER BY s.start_time ASC;
  `;
  return result.rows;
}

export async function getOfficeHourSlotsForStudent(studentId, cohortIds) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT s.*, c.name AS cohort_name, u.first_name, u.last_name
    FROM office_hour_slots s
    LEFT JOIN cohorts c ON c.id = s.cohort_id
    JOIN users u ON u.id = s.facilitator_id
    WHERE s.is_cancelled = false
      AND s.start_time >= CURRENT_TIMESTAMP
      ${cohortIds && cohortIds.length > 0 ? sql`AND (s.cohort_id IS NULL OR s.cohort_id = ANY(${cohortIds}))` : sql``}
    ORDER BY s.start_time ASC;
  `;
  return result.rows;
}

export async function getOfficeHourBookingsForSlot(slotId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT b.*, u.first_name, u.last_name, u.email
    FROM office_hour_bookings b
    JOIN users u ON u.id = b.student_id
    WHERE b.slot_id = ${slotId}
    ORDER BY b.booked_at ASC;
  `;
  return result.rows;
}

export async function bookOfficeHourSlot(slotId, studentId) {
  await ensureLmsSchema();
  const slotRes = await sql`SELECT capacity, is_cancelled FROM office_hour_slots WHERE id = ${slotId} LIMIT 1;`;
  if (!slotRes.rows[0] || slotRes.rows[0].is_cancelled) {
    throw new Error('Slot unavailable');
  }
  const current = await sql`
    SELECT COUNT(*)::int AS count
    FROM office_hour_bookings
    WHERE slot_id = ${slotId} AND status = 'booked';
  `;
  if (current.rows[0].count >= (slotRes.rows[0].capacity || 1)) {
    throw new Error('Slot is full');
  }
  const result = await sql`
    INSERT INTO office_hour_bookings (slot_id, student_id, status)
    VALUES (${slotId}, ${studentId}, 'booked')
    ON CONFLICT (slot_id, student_id) DO UPDATE SET status = 'booked'
    RETURNING *;
  `;
  return result.rows[0];
}

export async function cancelOfficeHourBooking(slotId, studentId) {
  await ensureLmsSchema();
  await sql`
    UPDATE office_hour_bookings
    SET status = 'cancelled'
    WHERE slot_id = ${slotId} AND student_id = ${studentId};
  `;
}

export async function cancelOfficeHourSlot(slotId) {
  await ensureLmsSchema();
  await sql`UPDATE office_hour_slots SET is_cancelled = true WHERE id = ${slotId};`;
}

// --- Job applications ---
export async function createJobApplication({ jobId, userId, name, email, resumeUrl, portfolioUrl, coverLetter }) {
  await ensureLmsSchema();
  const result = await sql`
    INSERT INTO job_applications (job_id, user_id, name, email, resume_url, portfolio_url, cover_letter)
    VALUES (${jobId}, ${userId || null}, ${name || null}, ${email || null}, ${resumeUrl || null}, ${portfolioUrl || null}, ${coverLetter || null})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getJobApplications(limit = 200) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT ja.*, j.title AS job_title, u.email AS user_email
    FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    LEFT JOIN users u ON u.id = ja.user_id
    ORDER BY ja.created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

// --- AI settings ---
export async function getAiSettings() {
  await ensureLmsSchema();
  const res = await sql`SELECT * FROM ai_settings WHERE id = 1 LIMIT 1;`;
  if (!res.rows[0]) {
    await sql`INSERT INTO ai_settings (id) VALUES (1);`;
    return { id: 1, system_prompt: null, daily_limit: 50, max_tokens: 700, blocked_phrases: null };
  }
  return res.rows[0];
}

export async function updateAiSettings({ systemPrompt, dailyLimit, maxTokens, blockedPhrases }) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO ai_settings (id, system_prompt, daily_limit, max_tokens, blocked_phrases)
    VALUES (1, ${systemPrompt || null}, ${dailyLimit ?? 50}, ${maxTokens ?? 700}, ${blockedPhrases || null})
    ON CONFLICT (id) DO UPDATE SET
      system_prompt = EXCLUDED.system_prompt,
      daily_limit = EXCLUDED.daily_limit,
      max_tokens = EXCLUDED.max_tokens,
      blocked_phrases = EXCLUDED.blocked_phrases;
  `;
  return getAiSettings();
}

export async function getNotificationPreferences(userId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT user_id, email_enabled, in_app_enabled,
           email_announcements, email_chat, email_assignments, email_grades, email_deadlines,
           in_app_announcements, in_app_chat, in_app_assignments, in_app_grades, in_app_deadlines,
           push_announcements, push_chat, push_assignments, push_grades, push_deadlines
    FROM notification_preferences
    WHERE user_id = ${userId}
    LIMIT 1;
  `;
  const row = result.rows[0] || {};
  return {
    user_id: userId,
    email_enabled: row.email_enabled !== false,
    in_app_enabled: row.in_app_enabled !== false,
    email_announcements: row.email_announcements !== false,
    email_chat: row.email_chat !== false,
    email_assignments: row.email_assignments !== false,
    email_grades: row.email_grades !== false,
    email_deadlines: row.email_deadlines !== false,
    in_app_announcements: row.in_app_announcements !== false,
    in_app_chat: row.in_app_chat !== false,
    in_app_assignments: row.in_app_assignments !== false,
    in_app_grades: row.in_app_grades !== false,
    in_app_deadlines: row.in_app_deadlines !== false,
    push_announcements: row.push_announcements !== false,
    push_chat: row.push_chat !== false,
    push_assignments: row.push_assignments !== false,
    push_grades: row.push_grades !== false,
    push_deadlines: row.push_deadlines !== false,
  };
}

export async function setNotificationPreferences(userId, {
  emailEnabled,
  inAppEnabled,
  emailAnnouncements,
  emailChat,
  emailAssignments,
  emailGrades,
  emailDeadlines,
  inAppAnnouncements,
  inAppChat,
  inAppAssignments,
  inAppGrades,
  inAppDeadlines,
  pushAnnouncements,
  pushChat,
  pushAssignments,
  pushGrades,
  pushDeadlines,
}) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO notification_preferences (
      user_id,
      email_enabled,
      in_app_enabled,
      email_announcements,
      email_chat,
      email_assignments,
      email_grades,
      email_deadlines,
      in_app_announcements,
      in_app_chat,
      in_app_assignments,
      in_app_grades,
      in_app_deadlines,
      push_announcements,
      push_chat,
      push_assignments,
      push_grades,
      push_deadlines,
      updated_at
    )
    VALUES (
      ${userId},
      ${emailEnabled},
      ${inAppEnabled},
      ${emailAnnouncements},
      ${emailChat},
      ${emailAssignments},
      ${emailGrades},
      ${emailDeadlines},
      ${inAppAnnouncements},
      ${inAppChat},
      ${inAppAssignments},
      ${inAppGrades},
      ${inAppDeadlines},
      ${pushAnnouncements},
      ${pushChat},
      ${pushAssignments},
      ${pushGrades},
      ${pushDeadlines},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email_enabled = EXCLUDED.email_enabled,
      in_app_enabled = EXCLUDED.in_app_enabled,
      email_announcements = EXCLUDED.email_announcements,
      email_chat = EXCLUDED.email_chat,
      email_assignments = EXCLUDED.email_assignments,
      email_grades = EXCLUDED.email_grades,
      email_deadlines = EXCLUDED.email_deadlines,
      in_app_announcements = EXCLUDED.in_app_announcements,
      in_app_chat = EXCLUDED.in_app_chat,
      in_app_assignments = EXCLUDED.in_app_assignments,
      in_app_grades = EXCLUDED.in_app_grades,
      in_app_deadlines = EXCLUDED.in_app_deadlines,
      push_announcements = EXCLUDED.push_announcements,
      push_chat = EXCLUDED.push_chat,
      push_assignments = EXCLUDED.push_assignments,
      push_grades = EXCLUDED.push_grades,
      push_deadlines = EXCLUDED.push_deadlines,
      updated_at = CURRENT_TIMESTAMP;
  `;
  return getNotificationPreferences(userId);
}

export async function getNotificationsForUser(userId, limit = 50, unreadOnly = false) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT *
    FROM notifications
    WHERE user_id = ${userId}
      ${unreadOnly ? sql`AND is_read = false` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function markNotificationRead(notificationId, userId) {
  await ensureLmsSchema();
  await sql`
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = ${notificationId} AND user_id = ${userId};
  `;
}

export async function markAllNotificationsRead(userId) {
  await ensureLmsSchema();
  await sql`
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId} AND is_read = false;
  `;
}

// --- Chat ---
export async function ensureCohortChatRoom(cohortId, title = null, createdBy = null) {
  await ensureLmsSchema();
  const existing = await sql`
    SELECT * FROM chat_rooms WHERE type = 'cohort' AND cohort_id = ${cohortId} LIMIT 1;
  `;
  if (existing.rows[0]) return existing.rows[0];
  const result = await sql`
    INSERT INTO chat_rooms (type, title, cohort_id, created_by)
    VALUES ('cohort', ${title}, ${cohortId}, ${createdBy})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function addChatRoomMember(roomId, userId) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO chat_room_members (room_id, user_id)
    VALUES (${roomId}, ${userId})
    ON CONFLICT (room_id, user_id) DO NOTHING;
  `;
}

export async function getChatRoomsForUser(userId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT r.*, (
      SELECT COUNT(*) FROM chat_room_members m WHERE m.room_id = r.id
    ) AS member_count
    FROM chat_rooms r
    JOIN chat_room_members m ON m.room_id = r.id
    WHERE m.user_id = ${userId}
    ORDER BY r.last_message_at DESC NULLS LAST, r.created_at DESC;
  `;
  return result.rows;
}

export async function findDmRoom(userId, otherUserId) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT r.*
    FROM chat_rooms r
    JOIN chat_room_members m1 ON m1.room_id = r.id AND m1.user_id = ${userId}
    JOIN chat_room_members m2 ON m2.room_id = r.id AND m2.user_id = ${otherUserId}
    WHERE r.type = 'dm'
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function createDmRoom(userId, otherUserId) {
  await ensureLmsSchema();
  const existing = await findDmRoom(userId, otherUserId);
  if (existing) return existing;
  const result = await sql`
    INSERT INTO chat_rooms (type, created_by)
    VALUES ('dm', ${userId})
    RETURNING *;
  `;
  const room = result.rows[0];
  await addChatRoomMember(room.id, userId);
  await addChatRoomMember(room.id, otherUserId);
  return room;
}

export async function getChatMessages(roomId, limit = 50, before = null, viewerId = null) {
  await ensureLmsSchema();
  const result = await sql`
    SELECT m.*, u.first_name, u.last_name, u.email
    FROM chat_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.room_id = ${roomId}
      AND m.is_deleted = false
      ${viewerId ? sql`AND (m.is_shadowbanned = false OR m.sender_id = ${viewerId})` : sql`AND m.is_shadowbanned = false`}
      ${before ? sql`AND m.created_at < ${before}` : sql``}
    ORDER BY m.created_at DESC
    LIMIT ${limit};
  `;
  return result.rows;
}

export async function createChatMessage(roomId, senderId, body) {
  await ensureLmsSchema();
  const senderRes = await sql`SELECT is_shadowbanned FROM users WHERE id = ${senderId} LIMIT 1;`;
  const isShadowbanned = senderRes.rows[0]?.is_shadowbanned === true;
  const result = await sql`
    INSERT INTO chat_messages (room_id, sender_id, body, is_shadowbanned)
    VALUES (${roomId}, ${senderId}, ${body}, ${isShadowbanned})
    RETURNING *;
  `;
  await sql`UPDATE chat_rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ${roomId}`;
  await sql`UPDATE chat_room_members SET last_read_at = CURRENT_TIMESTAMP WHERE room_id = ${roomId} AND user_id = ${senderId}`;
  return result.rows[0];
}

export async function reportChatMessage(messageId, reportedBy, reason = null) {
  await ensureLmsSchema();
  await sql`
    INSERT INTO message_reports (message_id, reported_by, reason)
    VALUES (${messageId}, ${reportedBy}, ${reason});
  `;
}

export async function markChatRoomRead(roomId, userId) {
  await ensureLmsSchema();
  await sql`
    UPDATE chat_room_members
    SET last_read_at = CURRENT_TIMESTAMP
    WHERE room_id = ${roomId} AND user_id = ${userId};
  `;
}

export async function setChatRoomMuted(roomId, userId, isMuted) {
  await ensureLmsSchema();
  await sql`
    UPDATE chat_room_members
    SET is_muted = ${isMuted}
    WHERE room_id = ${roomId} AND user_id = ${userId};
  `;
}
