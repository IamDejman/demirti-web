# Website Analytics System

This document describes the self-hosted analytics system: what is collected, how it works, retention, consent, and admin usage.

## What is collected

- **Pageviews and custom events**: URL, referrer, event name, optional properties (PII stripped).
- **Traffic attribution**: UTM parameters (utm_source, utm_medium, utm_campaign, utm_content, utm_term) and a derived **traffic channel** (Direct, Organic Search, Paid Search, Social, Referral, Email, Other).
- **Device and environment**: Device type (mobile/tablet/desktop), browser, OS, screen resolution, viewport size, language. Derived server-side from User-Agent and client-sent viewport/language.
- **Geography**: Country and city from IP geolocation. **Raw IP addresses are not stored.**
- **Engagement**: Time on page (seconds), scroll depth (max % and milestones 25/50/75/100), bounce (single-pageview sessions with short duration or low scroll).
- **Sessions and visitors**: Persistent visitor ID (localStorage), session ID (30-minute TTL). Session-level aggregates: entry/exit page, pageview/event counts, bounce, device/geo/traffic.

## Privacy

- **Consent**: A consent banner is shown on first visit. Tracking runs only when the user chooses **Allow**. Consent is stored in localStorage (`cverse_consent`: granted | denied | pending).
- **Do Not Track**: If the browser sends `DNT: 1`, tracking is treated as denied and no events are sent.
- **No raw IP**: IP is used only to resolve country/city; the IP is not stored.
- **PII stripping**: Event properties are filtered to remove known PII keys (email, name, phone, etc.). URLs and referrers are truncated to 2048 characters.

## Changing preferences

Users can change tracking preferences via the **Cookie / tracking preferences** link in the site footer. This reopens the consent modal so they can Allow or Decline.

## Data retention

- **Raw events**: Retained for **365 days**, then automatically deleted.
- **Aggregation**: Before deletion, data is aggregated into **daily_stats** (by date, traffic_channel, device_type, country) for historical reporting.
- **Cron**: A daily job runs at 02:00 UTC (configurable in `vercel.json`). It aggregates the previous day into `daily_stats` and deletes events older than 365 days.

## Admin analytics

- **Auth**: All analytics API routes require admin authentication (Bearer token or `admin_token` cookie). The dashboard sends the token in the `Authorization` header.
- **Endpoints** (all GET unless noted):
  - `/api/admin/analytics/overview` – summary stats (pageviews, visitors, sessions, bounce rate, avg duration, goal completions). Query: `days` or `start`/`end`, optional `compare`.
  - `/api/admin/analytics/realtime` – active visitors (last 5 min), by page, by country, last 20 events.
  - `/api/admin/analytics/traffic` – traffic by channel and by source/medium.
  - `/api/admin/analytics/pages` – top pages by views, entry pages, exit pages.
  - `/api/admin/analytics/engagement` – pageviews over time, avg time on page, scroll depth distribution.
  - `/api/admin/analytics/audience` – new vs returning, device, browser, country.
  - `/api/admin/analytics/funnels/:id` – funnel steps and conversion (query: `days`).
  - `/api/admin/analytics/goals` – goal completions and rates (query: `days`).
  - `/api/admin/analytics/events` – event counts and optional property breakdown (query: `days`, optional `event`).
  - `/api/admin/analytics/export` – CSV export. Query: `type` (events|sessions|daily_stats|goals|funnels), `start`, `end`. Events export is limited to 10,000 rows.

## Goals and funnels

- **Goals**: Admin-defined targets (pageview URL pattern or event name). Completions are recorded per session when a matching event occurs. Manage via Admin → Goals and `/api/admin/goals` (CRUD).
- **Funnels**: Multi-step sequences (pageview or event per step). Performance is computed on demand from events/sessions. Manage via Admin → Funnels and `/api/admin/funnels` (CRUD).

## Cron setup

- **Vercel**: The cron is defined in `vercel.json` and calls `/api/cron/analytics` daily. Set `CRON_SECRET` in the project environment; the route expects `Authorization: Bearer <CRON_SECRET>`.
- **Other hosts**: Call `GET /api/cron/analytics` with `Authorization: Bearer <CRON_SECRET>` once per day (e.g. via external cron or scheduler).

## Schema (summary)

- **events**: type, name, session_id, visitor_id, url, referrer, properties, UTM fields, traffic_channel, device_type, browser, os, screen_resolution, viewport_size, language, country, city, page_duration_seconds, scroll_depth_percent, created_at.
- **sessions**: session_id, visitor_id, started_at, ended_at, duration_seconds, pageview_count, event_count, entry_page, exit_page, bounced, device_type, browser, os, country, city, traffic_channel, utm_*, is_new_visitor, last_activity_at.
- **visitors**: visitor_id, first_seen_at, last_seen_at, total_sessions, total_pageviews, total_events.
- **goals**, **goal_completions**, **funnels**, **daily_stats**: See plan or `src/lib/db.js` for full definitions.
