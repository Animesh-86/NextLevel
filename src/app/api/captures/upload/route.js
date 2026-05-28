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

    // Get optional overrides from formData
    const overrideTitle = formData.get('title');
    const overrideDescription = formData.get('description');
    const overrideCategory = formData.get('category');
    const overrideUrgency = formData.get('urgency');
    const overrideTags = formData.get('tags');
    const overrideReminderAt = formData.get('reminderAt');
    const overrideReminderRepeats = formData.get('reminderRepeats');
    const overrideRawContent = formData.get('rawContent');

    // Only analyze if title or description is missing
    let analysis = {};
    if (!overrideTitle || !overrideDescription) {
      analysis = await analyzeImage(base64, file.type);
    }

    const finalTitle = overrideTitle || analysis.title || 'Screenshot Capture';
    const finalDescription = overrideDescription || analysis.summary || '';
    const finalCategory = overrideCategory || analysis.category || 'other';
    const finalUrgency = overrideUrgency || analysis.urgency || 'none';
    
    let finalTags = ['screenshot'];
    if (overrideTags) {
      finalTags = overrideTags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (analysis.tags) {
      finalTags = analysis.tags;
    }

    let finalReminderAt = null;
    if (overrideReminderAt) {
      finalReminderAt = new Date(overrideReminderAt);
    } else if (analysis.reminderSuggestion) {
      finalReminderAt = new Date(analysis.reminderSuggestion);
    }

    const finalRawContent = overrideRawContent || analysis.extractedText || '';

    // Store in DB
    await dbConnect();
    const capture = await Capture.create({
      userId: authResult.user.id,
      type: 'screenshot',
      title: finalTitle,
      rawContent: finalRawContent,
      description: finalDescription,
      imageData: `data:${file.type};base64,${base64}`,
      category: finalCategory,
      tags: finalTags,
      urgency: finalUrgency,
      reminderAt: finalReminderAt,
      reminderRepeats: overrideReminderRepeats || 'none',
    });

    // Return without the heavy imageData
    const responseData = capture.toObject();
    delete responseData.imageData;
    responseData.hasImage = true;

    return NextResponse.json({
      success: true,
      data: responseData,
    }, { status: 201 });
  } catch (err) {
    console.error('Error uploading screenshot:', err);
    return NextResponse.json({ error: 'Failed to process screenshot' }, { status: 500 });
  }
}
