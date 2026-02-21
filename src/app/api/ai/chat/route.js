import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureLmsSchema, recordLmsEvent, getAiSettings } from '@/lib/db-lms';
import { getUserFromRequest } from '@/lib/auth';
import { sendClaudeMessage } from '@/lib/ai';
import { rateLimit } from '@/lib/rateLimit';
import { reportError, safeErrorMessage } from '@/lib/logger';

const BASE_SYSTEM_PROMPT = `
You are the CVERSE Academy study assistant.
- Provide guidance, hints, and step-by-step coaching.
- Do not provide full assignment answers or do work that bypasses learning.
- Encourage learners to think and reflect.
- When unsure, ask a clarifying question.
`.trim();

async function getUsageForUser(userId, defaultLimit = 50) {
  const today = new Date().toISOString().slice(0, 10);
  const res = await sql`SELECT * FROM ai_usage_limits WHERE user_id = ${userId} LIMIT 1;`;
  if (!res.rows[0]) {
    await sql`
      INSERT INTO ai_usage_limits (user_id, period_start, usage_count, usage_limit)
      VALUES (${userId}, ${today}, 0, ${defaultLimit});
    `;
    return { period_start: today, usage_count: 0, usage_limit: defaultLimit };
  }
  const row = res.rows[0];
  if (row.period_start !== today) {
    await sql`
      UPDATE ai_usage_limits
      SET period_start = ${today}, usage_count = 0
      WHERE user_id = ${userId};
    `;
    return { period_start: today, usage_count: 0, usage_limit: row.usage_limit || defaultLimit };
  }
  return row;
}

async function getWeekContext(weekId) {
  if (!weekId) return null;
  const weekRes = await sql`
    SELECT w.*, c.name AS cohort_name
    FROM weeks w
    JOIN cohorts c ON c.id = w.cohort_id
    WHERE w.id = ${weekId}
    LIMIT 1;
  `;
  const week = weekRes.rows[0];
  if (!week) return null;
  const [contentRes, materialsRes, assignmentsRes] = await Promise.all([
    sql`SELECT title, type, description FROM content_items WHERE week_id = ${weekId} ORDER BY order_index ASC;`,
    sql`SELECT title, type, description FROM materials WHERE week_id = ${weekId};`,
    sql`SELECT title, description, deadline_at FROM assignments WHERE week_id = ${weekId} ORDER BY deadline_at ASC;`,
  ]);
  return {
    week,
    content: contentRes.rows,
    materials: materialsRes.rows,
    assignments: assignmentsRes.rows,
  };
}

function buildContextSources(context) {
  if (!context) return { contextText: '', sources: [] };
  const { week, content, materials, assignments } = context;
  const sources = [];
  let idx = 1;
  content.forEach((c) => {
    sources.push({ id: `C${idx++}`, type: 'content', title: c.title, detail: c.description || '', kind: c.type });
  });
  materials.forEach((m) => {
    sources.push({ id: `M${idx++}`, type: 'material', title: m.title, detail: m.description || '', kind: m.type });
  });
  assignments.forEach((a) => {
    sources.push({
      id: `A${idx++}`,
      type: 'assignment',
      title: a.title,
      detail: a.description || '',
      kind: a.deadline_at ? `due ${new Date(a.deadline_at).toLocaleDateString()}` : 'assignment',
    });
  });
  const sourcesText = sources
    .map((s) => `[${s.id}] ${s.type}: ${s.title}${s.kind ? ` (${s.kind})` : ''}${s.detail ? ` - ${s.detail}` : ''}`)
    .join('\n');
  const contextText = `
Week: ${week.title} (${week.cohort_name})
Description: ${week.description || ''}

Sources:
${sourcesText}
`.trim();
  return { contextText, sources };
}

function containsBlockedPhrase(message, blockedPhrases) {
  if (!blockedPhrases || blockedPhrases.length === 0) return false;
  const lower = message.toLowerCase();
  return blockedPhrases.some((phrase) => lower.includes(String(phrase || '').toLowerCase()));
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const message = (body.message || '').trim();
    const conversationId = body.conversationId;
    const weekId = body.weekId || null;
    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });
    if (message.length > 2000) return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    await ensureLmsSchema();
    const limiter = await rateLimit(`ai_chat_${user.id}`, { windowMs: 60_000, limit: 20 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const settings = await getAiSettings();
    if (containsBlockedPhrase(message, settings.blocked_phrases || [])) {
      await recordLmsEvent(user.id, 'ai_message_blocked', { reason: 'blocked_phrase' });
      return NextResponse.json({ error: 'Message contains blocked content' }, { status: 400 });
    }

    const usage = await getUsageForUser(user.id, settings.daily_limit || 50);
    if (usage.usage_count >= (usage.usage_limit || settings.daily_limit || 50)) {
      return NextResponse.json({ error: 'Daily AI usage limit reached' }, { status: 429 });
    }

    let conversation = null;
    if (conversationId) {
      const convRes = await sql`
        SELECT * FROM ai_conversations WHERE id = ${conversationId} AND user_id = ${user.id} LIMIT 1;
      `;
      conversation = convRes.rows[0];
    }
    if (!conversation) {
      const convRes = await sql`
        INSERT INTO ai_conversations (user_id, title)
        VALUES (${user.id}, ${'Study session'})
        RETURNING *;
      `;
      conversation = convRes.rows[0];
    }

    await sql`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (${conversation.id}, 'user', ${message});
    `;

    const historyRes = await sql`
      SELECT role, content
      FROM ai_messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC
      LIMIT 12;
    `;
    const history = historyRes.rows.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const context = await getWeekContext(weekId);
    const { contextText, sources } = buildContextSources(context);
    const systemPrompt = [
      BASE_SYSTEM_PROMPT,
      settings.system_prompt || '',
      contextText
        ? `Use the sources below when relevant. Cite sources inline like [C1] or [M2].\n\n${contextText}`
        : '',
    ].filter(Boolean).join('\n\n');

    const assistantReply = await sendClaudeMessage({
      messages: history,
      system: systemPrompt,
      maxTokens: settings.max_tokens || 700,
    });

    const sourcesList = sources.length > 0
      ? sources.map((s) => `- [${s.id}] ${s.title}${s.kind ? ` (${s.kind})` : ''}`).join('\n')
      : '';
    const finalReply = sourcesList ? `${assistantReply}\n\nSources:\n${sourcesList}` : assistantReply;

    await sql`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (${conversation.id}, 'assistant', ${finalReply});
    `;

    await sql`
      UPDATE ai_usage_limits
      SET usage_count = usage_count + 1
      WHERE user_id = ${user.id};
    `;

    await recordLmsEvent(user.id, 'ai_message_sent', { conversationId: conversation.id });

    return NextResponse.json({ conversationId: conversation.id, message: finalReply });
  } catch (e) {
    reportError(e, { route: 'POST /api/ai/chat' });
    return NextResponse.json({ error: safeErrorMessage(e, 'Failed to send message') }, { status: 500 });
  }
}
