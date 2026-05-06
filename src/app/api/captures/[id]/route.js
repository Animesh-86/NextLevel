import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import { requireAuth } from '@/lib/auth';

// GET /api/captures/[id] — Get single capture with full data (including imageData)
export async function GET(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const capture = await Capture.findOne({ _id: id, userId: authResult.user.id }).lean();
    if (!capture) {
      return NextResponse.json({ error: 'Capture not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: capture });
  } catch (err) {
    console.error('Error fetching capture:', err);
    return NextResponse.json({ error: 'Failed to fetch capture' }, { status: 500 });
  }
}

// PATCH /api/captures/[id] — Update a capture
export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const body = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      'title', 'description', 'category', 'tags', 'urgency',
      'reminderAt', 'reminderRepeats', 'isReminderDismissed',
      'isPinned', 'isArchived', 'status', 'rawContent',
    ];

    const update = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'tags') {
          update[field] = body[field].map(t => t.trim().toLowerCase()).filter(Boolean);
        } else if (field === 'reminderAt') {
          update[field] = body[field] ? new Date(body[field]) : null;
        } else {
          update[field] = body[field];
        }
      }
    }

    const capture = await Capture.findOneAndUpdate(
      { _id: id, userId: authResult.user.id },
      { $set: update },
      { new: true, runValidators: true }
    ).select('-imageData').lean();

    if (!capture) {
      return NextResponse.json({ error: 'Capture not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: capture });
  } catch (err) {
    console.error('Error updating capture:', err);
    return NextResponse.json({ error: 'Failed to update capture' }, { status: 500 });
  }
}

// DELETE /api/captures/[id] — Delete a capture
export async function DELETE(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const capture = await Capture.findOneAndDelete({ _id: id, userId: authResult.user.id });
    if (!capture) {
      return NextResponse.json({ error: 'Capture not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Capture deleted' });
  } catch (err) {
    console.error('Error deleting capture:', err);
    return NextResponse.json({ error: 'Failed to delete capture' }, { status: 500 });
  }
}
