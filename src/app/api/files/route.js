import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import StudyFile from '@/models/StudyFile';
import { requireAuth } from '@/lib/auth';
import { analyzePDF } from '@/lib/gemini';

// GET /api/files — List files
export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const fileType = searchParams.get('fileType');

  const filter = { userId: authResult.user.id, isArchived: { $ne: true } };
  if (category && category !== 'all') filter.category = category;
  if (fileType && fileType !== 'all') filter.fileType = fileType;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { fileName: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const files = await StudyFile.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .select('-fileData')
      .lean();

    return NextResponse.json({ success: true, data: files });
  } catch (err) {
    console.error('Error fetching files:', err);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST /api/files — Upload file
export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const customTitle = formData.get('title');
    const customCategory = formData.get('category');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Detect file type
    let fileType = 'other';
    if (file.type === 'application/pdf') fileType = 'pdf';
    else if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.includes('word') || file.type.includes('document')) fileType = 'doc';
    else if (file.type.includes('sheet') || file.type.includes('excel')) fileType = 'spreadsheet';

    // AI analysis for PDFs and images
    let aiData = { title: file.name, summary: '', category: 'other', tags: [] };
    if (fileType === 'pdf' || fileType === 'image') {
      try {
        aiData = await analyzePDF(base64, file.type, file.name);
      } catch (err) {
        console.error('AI analysis failed:', err.message);
      }
    }

    await dbConnect();
    const studyFile = await StudyFile.create({
      userId: authResult.user.id,
      fileName: file.name,
      fileType,
      mimeType: file.type,
      fileSize: file.size,
      fileData: dataUri,
      title: customTitle || aiData.title || file.name,
      summary: aiData.summary || '',
      category: customCategory || aiData.category || 'other',
      tags: aiData.tags || [],
    });

    const responseData = studyFile.toObject();
    delete responseData.fileData;

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (err) {
    console.error('Error uploading file:', err);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
