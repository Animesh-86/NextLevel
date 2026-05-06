import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedLink from '@/models/SavedLink';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const fields = ['title', 'url', 'description', 'category', 'tags', 'isPinned', 'isArchived'];
  const update = {};
  fields.forEach(f => { if (body[f] !== undefined) update[f] = body[f]; });
  try {
    const link = await SavedLink.findOneAndUpdate(
      { _id: id, userId: authResult.user.id }, { $set: update }, { new: true }
    ).lean();
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: link });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  try {
    await SavedLink.findOneAndDelete({ _id: id, userId: authResult.user.id });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
