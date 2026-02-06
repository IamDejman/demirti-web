# Ops Checklist

## Load testing
- Use k6 or Artillery to simulate 200-500 concurrent users on key routes.
- Target scenarios:
- `/api/auth/login` (bursty login load)
- `/api/chat/rooms/*/messages` (message throughput)
- `/api/assignments/*/submit` (file submissions)
- `/api/ai/chat` (AI limits + latency)
- `/api/announcements` (fan-out notifications)
- Capture p95 latency, error rate, and DB saturation.

## Security review
- Confirm secrets are stored in environment variables only.
- Ensure rate limiting on auth, chat, AI, and job apply endpoints.
- Review permissions on admin and facilitator routes (role checks).
- Validate file uploads: type, size, storage ACLs.
- Confirm session/token expiry and logout behavior.
- Spot-check SQL queries for injection safety (parameterized).

## Backups
- Enable automated backups on Vercel Postgres (daily).
- Perform restore drill quarterly:
- Provision a staging DB.
- Restore the latest backup.
- Run `/api/init-db` and verify LMS tables.
- Run smoke tests on staging.

## Monitoring & alerting
- Track uptime on `/api/health`.
- Configure error reporting (Sentry/Logflare) for production.
- Monitor key logs: payment webhooks, auth failures, cron jobs.
- Set alerts for high error rate, slow API responses, and DB errors.

## Rate limiting
- Confirm limits for:
- `/api/auth/login`, `/api/admin/login`
- `/api/chat/rooms/*/messages`
- `/api/ai/chat`
- `/api/jobs/*/apply`

## Data retention
- Define retention for chat messages, AI logs, and analytics events.
- Document any deletion/anonymization policy.
