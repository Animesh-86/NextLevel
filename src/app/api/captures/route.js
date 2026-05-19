import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import { requireAuth } from '@/lib/auth';
import { inngest } from '@/lib/inngest';

// GET /api/captures — List captures with filters
export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const urgency = searchParams.get('urgency');
  const status = searchParams.get('status') || 'active';
  const search = searchParams.get('search');
  const pinned = searchParams.get('pinned');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = parseInt(searchParams.get('skip') || '0');

  const filter = { userId: authResult.user.id };

  if (status !== 'all') filter.status = status;
  if (category && category !== 'all') filter.category = category;
  if (urgency && urgency !== 'all') filter.urgency = urgency;
  if (pinned === 'true') filter.isPinned = true;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { rawContent: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const [captures, total] = await Promise.all([
      Capture.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-imageData')
        .lean(),
      Capture.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: captures,
      total,
      hasMore: skip + captures.length < total,
    });
  } catch (err) {
    console.error('Error fetching captures:', err);
    return NextResponse.json({ error: 'Failed to fetch captures' }, { status: 500 });
  }
}

// POST /api/captures — Create a new capture
export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();

  try {
    const body = await request.json();
    const {
      type = 'text',
      title,
      rawContent = '',
      description = '',
      category = 'other',
      tags = [],
      urgency = 'none',
      reminderAt = null,
      reminderRepeats = 'none',
      imageData = null,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const capture = await Capture.create({
      userId: authResult.user.id,
      type,
      title: title.trim(),
      rawContent,
      description,
      category,
      tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      urgency,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      reminderRepeats,
      imageData,
    });

    // Trigger Inngest AI Core Workflow (Force Refresh)
    await inngest.send({
      name: "capture/created",
      data: {
        captureId: capture._id.toString(),
        content: capture.rawContent,
        type: capture.type,
      },
    });

    // Don't return imageData in response to keep it lightweight
    const responseData = capture.toObject();
    delete responseData.imageData;

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (err) {
    console.error('Error creating capture:', err);
    return NextResponse.json({ error: 'Failed to create capture' }, { status: 500 });
  }
}
