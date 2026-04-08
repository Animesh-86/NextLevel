import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { auth } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const module = searchParams.get('module');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = {};
    if (examId) query.examId = examId;
    if (module && module !== 'all') query.module = module;
    if (search) query.scenario = { $regex: search, $options: 'i' };

    const [questions, total] = await Promise.all([
      Question.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Question.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();

    // Support bulk insert
    if (Array.isArray(body)) {
      const questions = await Question.insertMany(body);
      return NextResponse.json({ success: true, data: questions }, { status: 201 });
    } else {
      const question = await Question.create(body);
      return NextResponse.json({ success: true, data: question }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    if (examId) {
      await Question.deleteMany({ examId });
      return NextResponse.json({ success: true, data: 'Cleared questions for exam' });
    } else {
      return NextResponse.json({ success: false, error: 'examId required for bulk delete' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
