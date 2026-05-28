import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { createResultSchema, validateBody } from '@/lib/validate';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const examId = searchParams.get('examId');

    const query = { userId: session.user.id };
    if (examId) query.examId = examId;

    const [results, total] = await Promise.all([
      Result.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('examId', 'title passPercentage')
        .lean(),
      Result.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const { error, data } = validateBody(createResultSchema, body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 422 });
    }

    const result = await Result.create({
      ...data,
      userId: session.user.id,
    });

    // Update user stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await User.findById(session.user.id);
    if (user) {
      // Update streak
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          user.streak += 1;
        } else if (diffDays > 1) {
          user.streak = 1;
        }
        // same day, no change to streak
      } else {
        user.streak = 1;
      }

      user.lastActiveDate = today;
      user.questionsAnswered += data.totalCount;
      if (data.timeTaken) {
        user.totalStudyMinutes += Math.round(data.timeTaken / 60);
      }
      await user.save();
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
