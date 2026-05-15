import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedLink from '@/models/SavedLink';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const filter = { userId: authResult.user.id, isArchived: { $ne: true } };
  if (category && category !== 'all') filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { url: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const links = await SavedLink.find(filter).sort({ isPinned: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: links });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const body = await request.json();

  if (!body.url || !body.title) {
    return NextResponse.json({ error: 'URL and title required' }, { status: 400 });
  }

  try {
    // Extract favicon
    let favicon = '';
    try {
      const urlObj = new URL(body.url);
      favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {}

    const link = await SavedLink.create({
      userId: authResult.user.id,
      url: body.url,
      title: body.title,
      description: body.description || '',
      category: body.category || 'other',
      tags: body.tags || [],
      favicon,
    });

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
