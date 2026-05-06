import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import { requireAuth } from '@/lib/auth';
import { analyzeImage } from '@/lib/gemini';

// POST /api/captures/upload — Upload screenshot, AI-analyze, create capture
export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPEG, WebP or GIF.' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Analyze with Gemini Vision
    const analysis = await analyzeImage(base64, file.type);

    // Store in DB
    await dbConnect();
    const capture = await Capture.create({
      userId: authResult.user.id,
      type: 'screenshot',
      title: analysis.title || 'Screenshot Capture',
      rawContent: analysis.extractedText || '',
      description: analysis.summary || '',
      imageData: `data:${file.type};base64,${base64}`,
      category: analysis.category || 'other',
      tags: analysis.tags || ['screenshot'],
      urgency: analysis.urgency || 'none',
      reminderAt: analysis.reminderSuggestion ? new Date(analysis.reminderSuggestion) : null,
    });

    // Return without the heavy imageData
    const responseData = capture.toObject();
    delete responseData.imageData;
    responseData.hasImage = true;

    return NextResponse.json({
      success: true,
      data: responseData,
      analysis,
    }, { status: 201 });
  } catch (err) {
    console.error('Error uploading screenshot:', err);
    return NextResponse.json({ error: 'Failed to process screenshot' }, { status: 500 });
  }
}
