import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlannerTask from '@/models/PlannerTask';
import { requireAuth } from '@/lib/auth';

// GET /api/planner?start=2026-05-05&end=2026-05-11
export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end dates required' }, { status: 400 });
  }

  try {
    const tasks = await PlannerTask.find({
      userId: authResult.user.id,
      scheduledDate: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    }).sort({ scheduledDate: 1, startTime: 1 }).lean();

    return NextResponse.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Error fetching planner tasks:', err);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/planner — Create task
export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();

  try {
    const body = await request.json();
    const {
      title, description = '', scheduledDate, startTime, endTime,
      duration = 30, category = 'study', priority = 'medium',
      linkedCaptureId, linkedFileId, isRecurring = false, recurPattern = 'none',
    } = body;

    if (!title || !scheduledDate) {
      return NextResponse.json({ error: 'Title and date required' }, { status: 400 });
    }

    const task = await PlannerTask.create({
      userId: authResult.user.id,
      title: title.trim(),
      description,
      scheduledDate: new Date(scheduledDate),
      startTime: startTime || null,
      endTime: endTime || null,
      duration,
      category,
      priority,
      linkedCaptureId: linkedCaptureId || null,
      linkedFileId: linkedFileId || null,
      isRecurring,
      recurPattern,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (err) {
    console.error('Error creating task:', err);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
