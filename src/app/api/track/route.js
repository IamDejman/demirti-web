import { NextResponse } from 'next/server';
import UAParser from 'ua-parser-js';
import { computeTrafficChannel } from '@/lib/analyticsConstants';
import {
  recordEvent,
  upsertVisitor,
  upsertSession,
  getVisitorSessionCount,
  getSessionBySessionId,
  updateSessionBounce,
  getActiveGoals,
  ensureGoalCompletionOnce,
} from '@/lib/db';

const MAX_BODY_BYTES = 32 * 1024; // 32KB

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) return realIp;
  return null;
}

function getDeviceType(parser) {
  const device = parser.getDevice();
  if (device?.type) return device.type; // mobile, tablet, etc.
  const ua = parser.getUA();
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    const body = JSON.parse(raw);

    const {
      type,
      name = null,
      sessionId = null,
      visitorId = null,
      url = null,
      referrer = null,
      properties = null,
      utmSource = null,
      utmMedium = null,
      utmCampaign = null,
      utmContent = null,
      utmTerm = null,
      screenResolution = null,
      viewportSize = null,
      language = null,
      pageDurationSeconds = null,
      scrollDepthPercent = null,
    } = body || {};

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event: type is required' },
        { status: 400 }
      );
    }

    const normalizedType = type.toLowerCase();

    const uaHeader = request.headers.get('user-agent') || '';
    const parser = new UAParser(uaHeader);
    const deviceType = getDeviceType(parser);
    const browser = parser.getBrowser().name || null;
    const os = parser.getOS().name || null;

    const ip = getClientIp(request);
    let country = null;
    let city = null;
    if (ip) {
      try {
        const geoip = (await import('geoip-lite')).default;
        const geo = geoip.lookup(ip);
        if (geo) {
          country = geo.country || null;
          city = geo.city || null;
        }
      } catch {
        // ignore geo errors (e.g. data files not available in serverless)
      }
    }

    const trafficChannel = computeTrafficChannel({
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      referrer: referrer || null,
    });

    const isPageview = normalizedType === 'pageview';
    const isPageExit = normalizedType === 'page_exit';
    const isEvent = normalizedType === 'event';

    let sessionBefore = null;
    if (sessionId) {
      sessionBefore = await getSessionBySessionId(sessionId);
    }

    if (visitorId && sessionId) {
      const sessionCount = await getVisitorSessionCount(visitorId);
      const isNewVisitor = sessionCount === 0;

      await upsertVisitor(visitorId, {
        isPageview: isPageview || isPageExit,
        isEvent: isEvent,
      });

      const entryPage = isPageview ? (typeof url === 'string' ? url : null) : null;
      await upsertSession(sessionId, visitorId, {
        entryPage,
        exitPage: typeof url === 'string' ? url : null,
        isPageview: isPageview || isPageExit,
        isEvent: isEvent,
        deviceType,
        browser,
        os,
        country,
        city,
        trafficChannel,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        isNewVisitor,
      });

      if (isPageExit && typeof pageDurationSeconds === 'number' && typeof scrollDepthPercent === 'number') {
        const singlePageview = (sessionBefore?.pageview_count ?? 0) === 1;
        const bounced = singlePageview && pageDurationSeconds < 10 && scrollDepthPercent < 25;
        await updateSessionBounce(sessionId, bounced);
      }
    }

    const safeEvent = {
      type: normalizedType,
      name: typeof name === 'string' ? name : null,
      sessionId: typeof sessionId === 'string' ? sessionId : null,
      visitorId: typeof visitorId === 'string' ? visitorId : null,
      url: typeof url === 'string' ? url : null,
      referrer: typeof referrer === 'string' ? referrer : null,
      properties: properties && typeof properties === 'object' ? properties : null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
      trafficChannel,
      deviceType,
      browser,
      os,
      screenResolution: screenResolution || null,
      viewportSize: viewportSize || null,
      language: language || null,
      country,
      city,
      pageDurationSeconds: pageDurationSeconds ?? null,
      scrollDepthPercent: scrollDepthPercent ?? null,
    };

    await recordEvent(safeEvent);

    const goals = await getActiveGoals();
    for (const goal of goals) {
      const matchType = goal.match_type || 'contains';
      const matchValue = (goal.match_value || '').toLowerCase();
      let matched = false;
      if (goal.type === 'pageview') {
        const u = (url || '').toLowerCase();
        if (matchType === 'exact' && u === matchValue) matched = true;
        else if (matchType === 'contains' && u.includes(matchValue)) matched = true;
        else if (matchType === 'regex' && new RegExp(matchValue).test(u)) matched = true;
      } else if (goal.type === 'event') {
        const n = (name || '').toLowerCase();
        if (matchType === 'exact' && n === matchValue) matched = true;
        else if (matchType === 'contains' && n.includes(matchValue)) matched = true;
        else if (matchType === 'regex' && new RegExp(matchValue).test(n)) matched = true;
      }
      if (matched && sessionId && visitorId) {
        await ensureGoalCompletionOnce(goal.id, sessionId, visitorId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}
