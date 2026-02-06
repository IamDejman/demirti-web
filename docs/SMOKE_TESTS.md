# LMS Smoke Tests

## Auth
- Admin login works (`/admin/login`).
- Student login works (`/login`).

## Core LMS
- Admin can create cohort, week content, assignments.
- Student can view week and submit assignment.
- Facilitator can grade submission.

## Chat
- User can send a message.
- Unread counts update.
- Moderation report + resolve works.

## Announcements
- Admin can create scheduled announcement.
- Cron or “Publish now” sends it.

## Portfolio
- Student can save portfolio, add project, add social link.
- Public portfolio loads via `/portfolio/[slug]`.

## AI Assistant
- Chat request returns response (API key configured).

## Certificates
- Admin issues certificate.
- Verification page works at `/verify/[code]`.
- PDF endpoint returns a PDF.

## Push notifications (if configured)
- User can subscribe.
- Announcements trigger push notification.
