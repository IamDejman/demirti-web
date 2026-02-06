import { NextResponse } from 'next/server';
import { getAiSettings, updateAiSettings } from '@/lib/db-lms';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdminOrUserFromRequest(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await getAiSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    console.error('GET /api/admin/ai-settings:', e);
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
    return NextResponse.json({ settings });
  } catch (e) {
    console.error('PUT /api/admin/ai-settings:', e);
    return NextResponse.json({ error: 'Failed to update AI settings' }, { status: 500 });
  }
}
