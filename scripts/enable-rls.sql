-- Enable Row Level Security on all public tables.
--
-- Context:
--   Supabase exposes every `public` table via PostgREST under the `anon`
--   and `authenticated` roles. This app does NOT use PostgREST — it talks
--   to Postgres directly via the `pg` pool as the table owner role
--   (DATABASE_URL). Owners bypass RLS by default, so enabling RLS with
--   no policies gives us:
--     - App (owner role)              -> works unchanged
--     - PostgREST (anon/authenticated) -> deny-all, tables effectively hidden
--
-- Run once against the Supabase project (SQL editor or psql).
-- Re-runnable: ENABLE ROW LEVEL SECURITY is idempotent.

ALTER TABLE public.admin_impersonations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_mfa                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_mfa_challenges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_resets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_facilitators        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_professionals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_hour_bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_hour_slots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_social_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_tracking       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_password_resets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checklist_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks                      ENABLE ROW LEVEL SECURITY;
