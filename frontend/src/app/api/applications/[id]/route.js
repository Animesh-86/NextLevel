import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Application from '@/models/Application';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  try {
    const app = await Application.findOne({ _id: id, userId: authResult.user.id });
    if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Add timeline event when status changes
    if (body.status && body.status !== app.status) {
      const statusLabels = {
        applied: 'Applied', screening: 'Phone Screening', technical: 'Technical Round',
        onsite: 'Onsite Interview', offer: 'Received Offer! 🎉',
        accepted: 'Accepted Offer! 🎊', rejected: 'Rejected 😔', ghosted: 'No Response',
      };
      app.timeline.push({ event: statusLabels[body.status] || body.status, date: new Date() });
    }

    // Add custom timeline event
    if (body.addEvent) {
      app.timeline.push({ event: body.addEvent.event, notes: body.addEvent.notes || '', date: new Date() });
    }

    const fields = ['company', 'role', 'type', 'status', 'salary', 'location', 'url', 'notes', 'linkedFileId', 'appliedDate'];
    fields.forEach(f => { if (body[f] !== undefined) app[f] = body[f]; });

    await app.save();
    return NextResponse.json({ success: true, data: app });
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
    await Application.findOneAndDelete({ _id: id, userId: authResult.user.id });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
