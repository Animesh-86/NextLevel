import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Result from '@/models/Result';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Compute achievements
    const totalResults = await Result.countDocuments({ userId: session.user.id });
    const passedResults = await Result.countDocuments({ userId: session.user.id, passed: true });
    const perfectScores = await Result.countDocuments({ userId: session.user.id, scorePercent: 100 });

    const achievements = [];
    if (totalResults >= 1) achievements.push({ id: 'first_exam', label: 'First Exam', icon: '🎯', desc: 'Completed your first exam' });
    if (user.streak >= 7) achievements.push({ id: 'streak_7', label: '7-Day Streak', icon: '🔥', desc: 'Practiced 7 days in a row' });
    if (perfectScores >= 1) achievements.push({ id: 'perfect', label: 'Perfect Score', icon: '💯', desc: 'Scored 100% on an exam' });
    if (user.questionsAnswered >= 100) achievements.push({ id: '100_questions', label: 'Century', icon: '📚', desc: 'Answered 100 questions' });
    if (passedResults >= 10) achievements.push({ id: '10_passed', label: 'Champion', icon: '🏆', desc: 'Passed 10 exams' });
    if (user.streak >= 30) achievements.push({ id: 'streak_30', label: 'Monthly Warrior', icon: '⚡', desc: '30-day streak' });
    if (user.questionsAnswered >= 500) achievements.push({ id: '500_questions', label: 'Scholar', icon: '🎓', desc: 'Answered 500 questions' });
    if (user.totalStudyMinutes >= 600) achievements.push({ id: '10_hours', label: 'Dedicated', icon: '⏰', desc: '10+ hours of study' });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        totalExams: totalResults,
        passedExams: passedResults,
        achievements,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const updates = {};

    if (body.name) updates.name = body.name;

    if (body.currentPassword && body.newPassword) {
      const user = await User.findById(session.user.id);
      const isValid = await bcrypt.compare(body.currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
      }
      updates.password = await bcrypt.hash(body.newPassword, 12);
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
