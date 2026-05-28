import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Application from '@/models/Application';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const company = searchParams.get('company');

  const filter = { userId: authResult.user.id };
  if (status && status !== 'all') filter.status = status;
  if (company) filter.company = { $regex: company, $options: 'i' };

  try {
    const apps = await Application.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: apps });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const body = await request.json();

  if (!body.company || !body.role) {
    return NextResponse.json({ error: 'Company and role required' }, { status: 400 });
  }

  try {
    const app = await Application.create({
      userId: authResult.user.id,
      company: body.company,
      role: body.role,
      type: body.type || 'full-time',
      status: body.status || 'bookmarked',
      appliedDate: body.appliedDate ? new Date(body.appliedDate) : null,
      salary: body.salary || '',
      location: body.location || '',
      url: body.url || '',
      notes: body.notes || '',
      linkedFileId: body.linkedFileId || null,
      timeline: body.status === 'applied'
        ? [{ event: 'Applied', date: new Date() }]
        : [{ event: 'Bookmarked', date: new Date() }],
    });
    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
