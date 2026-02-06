# QA Runbook (Live DB + Test Data)

## Preconditions
- Staging environment with production-like config.
- Seeded test data (tracks, cohort, weeks, assignments, users).
- AI, email (Resend), and storage env vars configured.
- Push notifications configured (VAPID keys).

## Happy-path flows
- Admin login → create cohort → create week → create assignment → publish.
- Student login → view week → submit assignment (file/link/text).
- Facilitator login → grade submission → student sees grade notification.
- Announcements: scheduled + “Publish now”.
- Chat: DM + cohort room, unread counts, moderation report.
- Office hours: facilitator creates slot → student books → calendar `.ics`.
- Portfolio: update profile, upload resume + project media, public page.
- Job apply: submit application with resume upload.
- Certificates: auto-issue for completed student, verify PDF.
- AI assistant: usage limit + blocked phrases + citations.

## Negative/edge cases
- Disabled or suspended user cannot log in.
- Shadowbanned user’s chat messages are hidden from others.
- Uploads reject disallowed file types or large files.
- Cron endpoints reject invalid secrets.

## Admin dashboards
- Analytics page loads LMS metrics + time series + cohort comparisons.
- AI usage dashboard loads.
- Moderation queue resolves and records actions.

## Post-run
- Export LMS events CSV and verify columns.
- Verify logs for cron runs, errors, and notifications.
