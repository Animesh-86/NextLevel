import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Question from '@/models/Question';
import Exam from '@/models/Exam';
import { auth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const result = await Result.findOne({
      _id: id,
      userId: session.user.id,
    }).lean();

    if (!result) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 });
    }

    // Get exam details
    const exam = await Exam.findById(result.examId).lean();

    // Get all questions for this result
    const questionIds = result.userAnswers ? Object.keys(result.userAnswers) : [];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();

    // Build detailed review
    const questionReview = questions.map((q) => {
      const userAnswer = result.userAnswers?.[q._id.toString()] || [];
      const isCorrect =
        userAnswer.length === q.answer.length &&
        userAnswer.every((a) => q.answer.includes(a));

      return {
        _id: q._id,
        scenario: q.scenario,
        options: q.options,
        type: q.type,
        module: q.module,
        correctAnswer: q.answer,
        userAnswer,
        isCorrect,
        explanation: q.explanation || '',
      };
    });

    // Module-level breakdown
    const moduleBreakdown = {};
    for (const q of questionReview) {
      if (!moduleBreakdown[q.module]) {
        moduleBreakdown[q.module] = { correct: 0, total: 0 };
      }
      moduleBreakdown[q.module].total++;
      if (q.isCorrect) moduleBreakdown[q.module].correct++;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        exam,
        questionReview,
        moduleBreakdown: Object.entries(moduleBreakdown).map(([name, data]) => ({
          module: name,
          correct: data.correct,
          total: data.total,
          percent: Math.round((data.correct / data.total) * 100),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
