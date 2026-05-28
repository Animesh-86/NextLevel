import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';
import { auth } from '@/lib/auth';
import { updateExamSchema, validateBody } from '@/lib/validate';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const exam = await Exam.findById(id).lean();

    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    // Get question count and result stats
    const [questionCount, resultStats] = await Promise.all([
      Question.countDocuments({ examId: id }),
      Result.aggregate([
        { $match: { examId: exam._id } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$scorePercent' },
            timesTaken: { $sum: 1 },
            passCount: { $sum: { $cond: ['$passed', 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = resultStats[0] || { avgScore: 0, timesTaken: 0, passCount: 0 };

    return NextResponse.json({
      success: true,
      data: {
        ...exam,
        questionCount,
        avgScore: Math.round(stats.avgScore || 0),
        timesTaken: stats.timesTaken,
        passRate: stats.timesTaken > 0 ? Math.round((stats.passCount / stats.timesTaken) * 100) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const { error, data } = validateBody(updateExamSchema, body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 422 });
    }

    const exam = await Exam.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });
    }

    // Also delete associated questions
    await Question.deleteMany({ examId: id });

    return NextResponse.json({ success: true, data: { message: 'Exam and its questions deleted' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
