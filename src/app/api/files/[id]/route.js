import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StudyFile from '@/models/StudyFile';
import { requireAuth } from '@/lib/auth';

// GET /api/files/[id] — Get file with data for viewing/downloading
export async function GET(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const file = await StudyFile.findOne({ _id: id, userId: authResult.user.id }).lean();
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: file });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

// PATCH /api/files/[id] — Update file metadata
export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const allowedFields = ['title', 'category', 'tags', 'isPinned', 'isArchived', 'summary'];
  const update = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field];
  }

  try {
    const file = await StudyFile.findOneAndUpdate(
      { _id: id, userId: authResult.user.id },
      { $set: update },
      { new: true }
    ).select('-fileData').lean();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: file });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

// DELETE /api/files/[id]
export async function DELETE(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const file = await StudyFile.findOneAndDelete({ _id: id, userId: authResult.user.id });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
