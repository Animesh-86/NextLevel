import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { analyzeText } from '@/lib/gemini';

// POST /api/captures/analyze — AI-analyze text/URL content
export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const analysis = await analyzeText(text.trim());

    return NextResponse.json({ success: true, data: analysis });
  } catch (err) {
    console.error('Error analyzing content:', err);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}
