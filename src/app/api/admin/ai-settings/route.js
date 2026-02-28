import { NextResponse } from 'next/server';
import { getAiSettings, updateAiSettings } from '@/lib/db-lms';
import { reportError } from '@/lib/logger';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await getAiSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    reportError(e, { route: 'GET /api/admin/ai-settings' });
    return NextResponse.json({ error: 'Failed to load AI settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const settings = await updateAiSettings({
      systemPrompt: body.systemPrompt,
      dailyLimit: body.dailyLimit != null ? Number(body.dailyLimit) : undefined,
      maxTokens: body.maxTokens != null ? Number(body.maxTokens) : undefined,
      blockedPhrases: Array.isArray(body.blockedPhrases) ? body.blockedPhrases : null,
    });

    recordAuditLog({
      userId: String(admin.id),
      action: 'ai_settings.updated',
      targetType: 'ai_settings',
      targetId: 'global',
      details: {
        daily_limit: body.dailyLimit,
        max_tokens: body.maxTokens,
        blocked_phrases_count: Array.isArray(body.blockedPhrases) ? body.blockedPhrases.length : null,
        system_prompt_changed: body.systemPrompt != null,
      },
      actorEmail: admin.email,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    }).catch(() => {});

    return NextResponse.json({ settings });
  } catch (e) {
    reportError(e, { route: 'PUT /api/admin/ai-settings' });
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
