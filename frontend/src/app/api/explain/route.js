import { NextResponse } from 'next/server';
import { explainQuestionWithAI } from '@/lib/ai';

export async function POST(request) {
  try {
    const { scenario, options, userAnswer, correctAnswer, type, existingExplanation } = await request.json();

    if (!scenario || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: 'Question scenario and options are required' },
        { status: 400 }
      );
    }

    const explanation = await explainQuestionWithAI({
      scenario,
      options,
      userAnswer,
      correctAnswer,
      type,
      existingExplanation,
    });

    return NextResponse.json({ success: true, explanation });
  } catch (error) {
    console.error('AI Explain error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate explanation: ' + error.message },
      { status: 500 }
    );
  }
}
