import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    const formData = await req.formData();
    const file = formData.get('audio') || formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'en',
      response_format: 'json',
      temperature: 0.1
    });

    return NextResponse.json({
      success: true,
      text: transcription.text ? transcription.text.trim() : ''
    });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
