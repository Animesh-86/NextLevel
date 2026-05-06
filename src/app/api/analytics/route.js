import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Capture from '@/models/Capture';
import PlannerTask from '@/models/PlannerTask';
import StudyFile from '@/models/StudyFile';
import Roadmap from '@/models/Roadmap';
import Application from '@/models/Application';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  await dbConnect();
  const uid = authResult.user.id;

  try {
    const [captures, tasks, files, roadmaps, apps] = await Promise.all([
      Capture.find({ userId: uid }).select('createdAt category status').lean(),
      PlannerTask.find({ userId: uid }).select('scheduledDate status duration category').lean(),
      StudyFile.find({ userId: uid }).select('createdAt category fileSize').lean(),
      Roadmap.find({ userId: uid }).select('title overallProgress status category milestones').lean(),
      Application.find({ userId: uid }).select('status company createdAt').lean(),
    ]);

    // Activity heatmap (last 90 days)
    const heatmap = {};
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      heatmap[d.toISOString().split('T')[0]] = 0;
    }
    captures.forEach(c => {
      const k = new Date(c.createdAt).toISOString().split('T')[0];
      if (heatmap[k] !== undefined) heatmap[k]++;
    });
    tasks.forEach(t => {
      const k = new Date(t.scheduledDate).toISOString().split('T')[0];
      if (heatmap[k] !== undefined) heatmap[k]++;
    });
    files.forEach(f => {
      const k = new Date(f.createdAt).toISOString().split('T')[0];
      if (heatmap[k] !== undefined) heatmap[k]++;
    });

    // Weekly task completion (last 4 weeks)
    const weeklyData = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - w * 7 - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const weekTasks = tasks.filter(t => {
        const d = new Date(t.scheduledDate);
        return d >= start && d <= end;
      });
      weeklyData.push({
        week: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: weekTasks.length,
        done: weekTasks.filter(t => t.status === 'done').length,
        hours: Math.round(weekTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.duration || 0), 0) / 60),
      });
    }

    // Category distribution
    const catCounts = {};
    tasks.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
    const categoryData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

    // Application pipeline
    const pipeline = {};
    apps.forEach(a => { pipeline[a.status] = (pipeline[a.status] || 0) + 1; });

    // Streak calculation
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      if (heatmap[k] > 0) streak++;
      else if (i > 0) break;
    }

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        weeklyData,
        categoryData,
        pipeline,
        streak,
        counts: {
          captures: captures.length,
          tasks: tasks.length,
          tasksDone: tasks.filter(t => t.status === 'done').length,
          files: files.length,
          roadmaps: roadmaps.length,
          roadmapsActive: roadmaps.filter(r => r.status === 'active').length,
          applications: apps.length,
          totalStudyHours: Math.round(tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.duration || 0), 0) / 60),
        },
        roadmapSummaries: roadmaps.filter(r => r.status === 'active').map(r => ({
          _id: r._id, title: r.title, progress: r.overallProgress, category: r.category,
        })),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
