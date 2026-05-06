import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlannerTask from '@/models/PlannerTask';
import { requireAuth } from '@/lib/auth';

// PATCH /api/planner/[id] — Update task
export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    'title', 'description', 'scheduledDate', 'startTime', 'endTime',
    'duration', 'category', 'priority', 'status',
    'linkedCaptureId', 'linkedFileId', 'isRecurring', 'recurPattern',
  ];

  const update = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'scheduledDate') {
        update[field] = new Date(body[field]);
      } else {
        update[field] = body[field];
      }
    }
  }

  try {
    const task = await PlannerTask.findOneAndUpdate(
      { _id: id, userId: authResult.user.id },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: task });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/planner/[id]
export async function DELETE(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const task = await PlannerTask.findOneAndDelete({ _id: id, userId: authResult.user.id });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
