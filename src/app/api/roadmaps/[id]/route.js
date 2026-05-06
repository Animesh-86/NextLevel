import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Roadmap from '@/models/Roadmap';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  try {
    const roadmap = await Roadmap.findOne({ _id: id, userId: authResult.user.id }).lean();
    if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: roadmap });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  try {
    const roadmap = await Roadmap.findOne({ _id: id, userId: authResult.user.id });
    if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Toggle a specific task within a milestone
    if (body.toggleTask) {
      const { milestoneId, taskId } = body.toggleTask;
      const milestone = roadmap.milestones.id(milestoneId);
      if (milestone) {
        const task = milestone.tasks.id(taskId);
        if (task) {
          task.done = !task.done;
          task.completedAt = task.done ? new Date() : null;
          // Auto-update milestone status
          const allDone = milestone.tasks.every(t => t.done);
          const anyDone = milestone.tasks.some(t => t.done);
          milestone.status = allDone ? 'completed' : anyDone ? 'in-progress' : 'not-started';
        }
      }
    }

    // Update milestone status
    if (body.updateMilestone) {
      const { milestoneId, status } = body.updateMilestone;
      const milestone = roadmap.milestones.id(milestoneId);
      if (milestone) milestone.status = status;
    }

    // Add a task to a milestone
    if (body.addTask) {
      const { milestoneId, title } = body.addTask;
      const milestone = roadmap.milestones.id(milestoneId);
      if (milestone) milestone.tasks.push({ title, done: false });
    }

    // Update basic fields
    const basicFields = ['title', 'description', 'category', 'targetDate', 'status', 'color'];
    basicFields.forEach(f => { if (body[f] !== undefined) roadmap[f] = body[f]; });

    await roadmap.save(); // triggers pre-save for progress calc
    return NextResponse.json({ success: true, data: roadmap });
  } catch (err) {
    console.error('Roadmap update error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  try {
    await Roadmap.findOneAndDelete({ _id: id, userId: authResult.user.id });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
