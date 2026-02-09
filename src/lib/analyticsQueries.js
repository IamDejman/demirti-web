import { sqlRead } from '@/lib/db-read';
import { ensureDatabaseInitialized } from '@/lib/db';

export async function getAnalyticsOverview(startDate, endDate, comparePrevious = false) {
  await ensureDatabaseInitialized();

  const pageviewsResult = await sqlRead`
    SELECT COUNT(*) AS total FROM events
    WHERE type = 'pageview' AND created_at BETWEEN ${startDate} AND ${endDate}
  `;
  const totalPageviews = Number(pageviewsResult.rows[0]?.total ?? 0);

  const visitorsResult = await sqlRead`
    SELECT COUNT(DISTINCT visitor_id) AS total FROM events
    WHERE created_at BETWEEN ${startDate} AND ${endDate} AND visitor_id IS NOT NULL
  `;
  const uniqueVisitors = Number(visitorsResult.rows[0]?.total ?? 0);

  const sessionsResult = await sqlRead`
    SELECT COUNT(*) AS total FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
  `;
  const totalSessions = Number(sessionsResult.rows[0]?.total ?? 0);

  const bounceResult = await sqlRead`
    SELECT COUNT(*) AS bounces FROM sessions
    WHERE started_at BETWEEN ${startDate} AND ${endDate} AND bounced = true
  `;
  const bounces = Number(bounceResult.rows[0]?.bounces ?? 0);
  const bounceRate = totalSessions > 0 ? bounces / totalSessions : 0;

  const durationResult = await sqlRead`
    SELECT SUM(duration_seconds) AS total, COUNT(*) AS cnt FROM sessions
    WHERE started_at BETWEEN ${startDate} AND ${endDate} AND duration_seconds IS NOT NULL
  `;
  const totalDuration = Number(durationResult.rows[0]?.total ?? 0);
  const durationCount = Number(durationResult.rows[0]?.cnt ?? 0);
  const avgSessionDuration = durationCount > 0 ? totalDuration / durationCount : 0;

  const goalCompletionsResult = await sqlRead`
    SELECT COUNT(*) AS total FROM goal_completions WHERE completed_at BETWEEN ${startDate} AND ${endDate}
  `;
  const goalCompletions = Number(goalCompletionsResult.rows[0]?.total ?? 0);

  let previous = null;
  if (comparePrevious) {
    const rangeMs = endDate - startDate;
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - rangeMs);
    previous = await getAnalyticsOverview(prevStart, prevEnd, false);
  }

  return {
    totalPageviews,
    uniqueVisitors,
    totalSessions,
    bounceRate,
    avgSessionDuration,
    goalCompletions,
    previous,
  };
}

export async function getRealtime() {
  await ensureDatabaseInitialized();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await sqlRead`
    SELECT session_id, visitor_id, exit_page, country, last_activity_at
    FROM sessions WHERE last_activity_at >= ${fiveMinutesAgo}
    ORDER BY last_activity_at DESC
  `;

  const byPage = await sqlRead`
    SELECT exit_page AS page, COUNT(*) AS count
    FROM sessions WHERE last_activity_at >= ${fiveMinutesAgo} AND exit_page IS NOT NULL
    GROUP BY exit_page ORDER BY count DESC
  `;

  const byCountry = await sqlRead`
    SELECT country, COUNT(*) AS count
    FROM sessions WHERE last_activity_at >= ${fiveMinutesAgo} AND country IS NOT NULL AND country != ''
    GROUP BY country ORDER BY count DESC
  `;

  const recentEvents = await sqlRead`
    SELECT type, name, url, session_id, created_at
    FROM events ORDER BY created_at DESC LIMIT 20
  `;

  return {
    activeCount: activeSessions.rows.length,
    activeSessions: activeSessions.rows,
    activeByPage: byPage.rows,
    activeByCountry: byCountry.rows,
    recentEvents: recentEvents.rows,
  };
}

export async function getTraffic(startDate, endDate) {
  await ensureDatabaseInitialized();

  const byChannel = await sqlRead`
    SELECT COALESCE(traffic_channel, 'direct') AS channel, COUNT(*) AS pageviews
    FROM events WHERE type = 'pageview' AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY traffic_channel ORDER BY pageviews DESC
  `;

  const bySourceMedium = await sqlRead`
    SELECT COALESCE(utm_source, 'direct') AS source, COALESCE(utm_medium, '') AS medium,
      COUNT(*) AS pageviews
    FROM events WHERE type = 'pageview' AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY utm_source, utm_medium ORDER BY pageviews DESC
  `;

  const sessionsByChannel = await sqlRead`
    SELECT COALESCE(traffic_channel, 'direct') AS channel, COUNT(*) AS sessions,
      COUNT(*) FILTER (WHERE bounced = true) AS bounces
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY traffic_channel
  `;

  const goalByChannel = await sqlRead`
    SELECT COALESCE(s.traffic_channel, 'direct') AS channel, COUNT(DISTINCT gc.id) AS completions
    FROM goal_completions gc
    JOIN sessions s ON s.session_id = gc.session_id
    WHERE gc.completed_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY s.traffic_channel
  `;

  return {
    byChannel: byChannel.rows,
    bySourceMedium: bySourceMedium.rows,
    sessionsByChannel: sessionsByChannel.rows,
    goalByChannel: goalByChannel.rows,
  };
}

export async function getPages(startDate, endDate, limit = 20) {
  await ensureDatabaseInitialized();

  const topByViews = await sqlRead`
    SELECT url, COUNT(*) AS views,
      COUNT(DISTINCT visitor_id) AS unique_visitors
    FROM events WHERE type = 'pageview' AND url IS NOT NULL AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY url ORDER BY views DESC LIMIT ${limit}
  `;

  const entryPages = await sqlRead`
    SELECT entry_page AS url, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate} AND entry_page IS NOT NULL
    GROUP BY entry_page ORDER BY sessions DESC LIMIT ${limit}
  `;

  const exitPages = await sqlRead`
    SELECT exit_page AS url, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate} AND exit_page IS NOT NULL
    GROUP BY exit_page ORDER BY sessions DESC LIMIT ${limit}
  `;

  const withDuration = await sqlRead`
    SELECT e.url, COUNT(*) AS views,
      AVG(e.page_duration_seconds)::INTEGER AS avg_duration_seconds
    FROM events e
    WHERE e.type = 'pageview' AND e.url IS NOT NULL AND e.created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY e.url ORDER BY views DESC LIMIT ${limit}
  `;

  return {
    topByViews: topByViews.rows,
    entryPages: entryPages.rows,
    exitPages: exitPages.rows,
    withDuration: withDuration.rows,
  };
}

export async function getEngagement(startDate, endDate) {
  await ensureDatabaseInitialized();

  const pageviewsByDay = await sqlRead`
    SELECT DATE_TRUNC('day', created_at)::DATE AS day, COUNT(*) AS pageviews
    FROM events WHERE type = 'pageview' AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY day ORDER BY day ASC
  `;

  const avgTimeByDay = await sqlRead`
    SELECT DATE_TRUNC('day', created_at)::DATE AS day,
      AVG(page_duration_seconds)::INTEGER AS avg_duration_seconds
    FROM events WHERE type = 'page_exit' AND page_duration_seconds IS NOT NULL AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY day ORDER BY day ASC
  `;

  const scrollDepth = await sqlRead`
    SELECT scroll_depth_percent AS depth, COUNT(*) AS count
    FROM events WHERE type = 'page_exit' AND scroll_depth_percent IS NOT NULL AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY scroll_depth_percent ORDER BY scroll_depth_percent ASC
  `;

  return {
    pageviewsByDay: pageviewsByDay.rows,
    avgTimeByDay: avgTimeByDay.rows,
    scrollDepth: scrollDepth.rows,
  };
}

export async function getAudience(startDate, endDate) {
  await ensureDatabaseInitialized();

  const newVsReturning = await sqlRead`
    SELECT is_new_visitor, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY is_new_visitor
  `;

  const byDevice = await sqlRead`
    SELECT COALESCE(device_type, 'unknown') AS device_type, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY device_type ORDER BY sessions DESC
  `;

  const byBrowser = await sqlRead`
    SELECT COALESCE(browser, 'unknown') AS browser, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY browser ORDER BY sessions DESC
  `;

  const byCountry = await sqlRead`
    SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS sessions
    FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY country ORDER BY sessions DESC
  `;

  return {
    newVsReturning: newVsReturning.rows,
    byDevice: byDevice.rows,
    byBrowser: byBrowser.rows,
    byCountry: byCountry.rows,
  };
}

export async function getFunnelPerformance(funnelId, startDate, endDate) {
  await ensureDatabaseInitialized();
  const funnelResult = await sqlRead`SELECT * FROM funnels WHERE id = ${funnelId} LIMIT 1`;
  const funnel = funnelResult.rows[0];
  if (!funnel || !funnel.steps || !Array.isArray(funnel.steps) || funnel.steps.length === 0) {
    return { funnel: null, steps: [], conversionRate: 0 };
  }

  const steps = funnel.steps;
  const stepCounts = [];
  let previousSessionIds = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const type = step.type || 'pageview';
    const matchValue = step.match_value || '';

    if (type === 'pageview') {
      const pattern = matchValue.includes('%') ? matchValue.replace(/%/g, '') : matchValue;
      const clause = previousSessionIds
        ? sqlRead`AND session_id IN (SELECT unnest(${previousSessionIds}::text[]))`
        : sqlRead``;
      const r = await sqlRead`
        SELECT array_agg(DISTINCT session_id) AS session_ids
        FROM events
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
          AND type = 'pageview' AND url LIKE ${'%' + pattern + '%'}
          ${clause}
      `;
      const sessionIds = (r.rows[0]?.session_ids || []).filter(Boolean);
      stepCounts.push({ label: step.label || `Step ${i + 1}`, count: sessionIds.length });
      previousSessionIds = sessionIds;
    } else {
      const r = previousSessionIds
        ? await sqlRead`
            SELECT array_agg(DISTINCT session_id) AS session_ids FROM events
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
              AND type = 'event' AND name = ${matchValue}
              AND session_id IN (SELECT unnest(${previousSessionIds}::text[]))
          `
        : await sqlRead`
            SELECT array_agg(DISTINCT session_id) AS session_ids FROM events
            WHERE created_at BETWEEN ${startDate} AND ${endDate}
              AND type = 'event' AND name = ${matchValue}
          `;
      const sessionIds = (r.rows[0]?.session_ids || []).filter(Boolean);
      stepCounts.push({ label: step.label || step.match_value, count: sessionIds.length });
      previousSessionIds = sessionIds;
    }
  }

  const firstCount = stepCounts[0]?.count ?? 0;
  const lastCount = stepCounts[stepCounts.length - 1]?.count ?? 0;
  const conversionRate = firstCount > 0 ? lastCount / firstCount : 0;

  return {
    funnel: { id: funnel.id, name: funnel.name, steps: funnel.steps },
    steps: stepCounts,
    conversionRate,
  };
}

export async function getGoalsPerformance(startDate, endDate) {
  await ensureDatabaseInitialized();
  const goals = await sqlRead`SELECT * FROM goals ORDER BY name`;
  const results = [];
  for (const goal of goals.rows) {
    const r = await sqlRead`
      SELECT COUNT(*) AS completions FROM goal_completions
      WHERE goal_id = ${goal.id} AND completed_at BETWEEN ${startDate} AND ${endDate}
    `;
    const completions = Number(r.rows[0]?.completions ?? 0);
    const sessionsInRange = await sqlRead`
      SELECT COUNT(*) AS total FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate}
    `;
    const totalSessions = Number(sessionsInRange.rows[0]?.total ?? 0);
    const completionRate = totalSessions > 0 ? completions / totalSessions : 0;
    results.push({
      ...goal,
      completions,
      completionRate,
    });
  }
  return results;
}

export async function getEventsExplorer(startDate, endDate, eventName = null) {
  await ensureDatabaseInitialized();

  const eventCounts = await sqlRead`
    SELECT COALESCE(name, '') AS name, COUNT(*) AS count
    FROM events WHERE type = 'event' AND created_at BETWEEN ${startDate} AND ${endDate}
    GROUP BY name ORDER BY count DESC
  `;

  let propertyBreakdown = null;
  if (eventName) {
    const withProps = await sqlRead`
      SELECT properties FROM events
      WHERE type = 'event' AND name = ${eventName} AND created_at BETWEEN ${startDate} AND ${endDate}
      AND properties IS NOT NULL
    `;
    const keys = new Set();
    const valueCounts = {};
    for (const row of withProps.rows) {
      const p = row.properties || {};
      for (const [k, v] of Object.entries(p)) {
        keys.add(k);
        const key = `${k}:${String(v)}`;
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      }
    }
    propertyBreakdown = { keys: [...keys], valueCounts: valueCounts };
  }

  return {
    eventCounts: eventCounts.rows,
    propertyBreakdown,
  };
}

export async function getDailyStatsForExport(startDate, endDate) {
  await ensureDatabaseInitialized();
  const result = await sqlRead`
    SELECT * FROM daily_stats WHERE date BETWEEN ${startDate} AND ${endDate} ORDER BY date, traffic_channel, device_type, country
  `;
  return result.rows;
}

export async function getEventsForExport(startDate, endDate, limit = 10000) {
  await ensureDatabaseInitialized();
  const result = await sqlRead`
    SELECT id, type, name, session_id, visitor_id, url, referrer, traffic_channel, device_type, browser, os, country, city, page_duration_seconds, scroll_depth_percent, created_at
    FROM events WHERE created_at BETWEEN ${startDate} AND ${endDate}
    ORDER BY created_at DESC LIMIT ${limit}
  `;
  return result.rows;
}

export async function getSessionsForExport(startDate, endDate, limit = 10000) {
  await ensureDatabaseInitialized();
  const result = await sqlRead`
    SELECT * FROM sessions WHERE started_at BETWEEN ${startDate} AND ${endDate} ORDER BY started_at DESC LIMIT ${limit}
  `;
  return result.rows;
}
