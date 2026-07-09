import { NextResponse } from 'next/server';
import { generateQuestionsFromText } from '@/lib/ai';

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    const questions = await generateQuestionsFromText(text);

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate questions: ' + error.message }, { status: 500 });
  }
}
