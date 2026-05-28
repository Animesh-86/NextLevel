import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Result from '@/models/Result';
import Question from '@/models/Question';
import Exam from '@/models/Exam';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;

    // Parallel queries for performance
    const [
      totalExamsTaken,
      results,
      totalQuestions,
      examCount,
      user,
    ] = await Promise.all([
      Result.countDocuments({ userId }),
      Result.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Question.countDocuments(),
      Exam.countDocuments(),
      User.findById(userId).lean(),
    ]);

    // Calculate average score
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.scorePercent, 0) / results.length)
      : 0;

    // Pass rate
    const passCount = results.filter(r => r.passed).length;
    const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;

    // Best score
    const bestScore = results.length > 0
      ? Math.max(...results.map(r => r.scorePercent))
      : 0;

    // Module-level performance for radar chart
    // Get all questions the user answered from results
    const modulePerformance = {};
    for (const result of results) {
      if (!result.userAnswers) continue;
      const questionIds = Object.keys(result.userAnswers);
      if (questionIds.length === 0) continue;

      const questions = await Question.find({ _id: { $in: questionIds } }).lean();
      for (const q of questions) {
        const userAnswer = result.userAnswers[q._id.toString()];
        if (!modulePerformance[q.module]) {
          modulePerformance[q.module] = { correct: 0, total: 0 };
        }
        modulePerformance[q.module].total++;

        // Check if answer is correct
        const isCorrect = Array.isArray(userAnswer) &&
          userAnswer.length === q.answer.length &&
          userAnswer.every(a => q.answer.includes(a));
        if (isCorrect) modulePerformance[q.module].correct++;
      }
    }

    const radarData = Object.entries(modulePerformance).map(([module, data]) => ({
      subject: module,
      A: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      fullMark: 100,
    }));

    // Weekly progress (last 7 results by date)
    const weeklyResults = results.slice(0, 7).reverse().map((r, i) => ({
      name: new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      score: r.scorePercent,
    }));

    // Recent activity
    const recentResults = results.slice(0, 5);
    const recentActivity = [];
    for (const r of recentResults) {
      const exam = await Exam.findById(r.examId).lean();
      recentActivity.push({
        id: r._id,
        examTitle: exam?.title || 'Unknown Exam',
        score: r.scorePercent,
        passed: r.passed,
        date: r.createdAt,
      });
    }

    // Questions needing review (high fail rate)
    const needsReview = await Question.countDocuments({
      timesTested: { $gt: 0 },
      $expr: { $gte: [{ $divide: ['$timesFailed', '$timesTested'] }, 0.5] },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalExamsTaken,
        avgScore,
        passRate,
        bestScore,
        totalQuestions,
        examCount,
        needsReview,
        streak: user?.streak || 0,
        radarData,
        weeklyProgress: weeklyResults,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
