import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import { requireAuth } from '@/lib/auth';

// GET /api/captures/reminders — Get upcoming/overdue reminders
export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await dbConnect();

  try {
    const now = new Date();

    // Get overdue reminders
    const overdue = await Capture.find({
      userId: authResult.user.id,
      reminderAt: { $lte: now },
      isReminderDismissed: false,
      status: 'active',
    }).select('-imageData').sort({ reminderAt: 1 }).limit(10).lean();

    // Get upcoming reminders (next 7 days)
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = await Capture.find({
      userId: authResult.user.id,
      reminderAt: { $gt: now, $lte: weekFromNow },
      isReminderDismissed: false,
      status: 'active',
    }).select('-imageData').sort({ reminderAt: 1 }).limit(10).lean();

    // Total unread count
    const totalPending = await Capture.countDocuments({
      userId: authResult.user.id,
      reminderAt: { $lte: now },
      isReminderDismissed: false,
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      data: {
        overdue,
        upcoming,
        totalPending,
      },
    });
  } catch (err) {
    console.error('Error fetching reminders:', err);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
