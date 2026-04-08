import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import { auth } from '@/lib/auth';
import { createExamSchema, validateBody } from '@/lib/validate';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const exams = await Exam.find({}).sort({ createdAt: -1 }).lean();

    // Enrich with question counts
    const enrichedExams = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        return { ...exam, questionCount };
      })
    );

    return NextResponse.json({ success: true, data: enrichedExams });
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

    const { error, data } = validateBody(createExamSchema, body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 422 });
    }

    const exam = await Exam.create(data);
    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
