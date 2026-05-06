import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Roadmap from '@/models/Roadmap';
import { requireAuth } from '@/lib/auth';

const TEMPLATES = [
  {
    title: 'DSA Mastery in 4 Weeks',
    description: 'Complete data structures and algorithms from basics to advanced.',
    category: 'dsa',
    color: '#ef4444',
    milestones: [
      { title: 'Arrays & Strings', order: 0, tasks: [
        { title: 'Two Sum', done: false }, { title: 'Best Time to Buy/Sell Stock', done: false },
        { title: 'Valid Anagram', done: false }, { title: 'Longest Substring Without Repeating', done: false },
        { title: 'Container With Most Water', done: false },
      ]},
      { title: 'Linked Lists & Stacks', order: 1, tasks: [
        { title: 'Reverse Linked List', done: false }, { title: 'Merge Two Sorted Lists', done: false },
        { title: 'Valid Parentheses', done: false }, { title: 'Min Stack', done: false },
      ]},
      { title: 'Trees & Graphs', order: 2, tasks: [
        { title: 'Binary Tree Inorder Traversal', done: false }, { title: 'Max Depth of Binary Tree', done: false },
        { title: 'Level Order Traversal', done: false }, { title: 'Number of Islands', done: false },
        { title: 'Course Schedule', done: false },
      ]},
      { title: 'Dynamic Programming', order: 3, tasks: [
        { title: 'Climbing Stairs', done: false }, { title: 'House Robber', done: false },
        { title: 'Longest Common Subsequence', done: false }, { title: 'Coin Change', done: false },
        { title: '0/1 Knapsack', done: false },
      ]},
    ],
  },
  {
    title: 'System Design in 6 Weeks',
    description: 'Master system design fundamentals for interviews.',
    category: 'system-design',
    color: '#3b82f6',
    milestones: [
      { title: 'Fundamentals', order: 0, tasks: [
        { title: 'Scalability Concepts', done: false }, { title: 'CAP Theorem', done: false },
        { title: 'Load Balancing', done: false }, { title: 'Caching Strategies', done: false },
      ]},
      { title: 'Storage & Databases', order: 1, tasks: [
        { title: 'SQL vs NoSQL', done: false }, { title: 'Database Sharding', done: false },
        { title: 'Replication Patterns', done: false },
      ]},
      { title: 'Design Patterns', order: 2, tasks: [
        { title: 'URL Shortener', done: false }, { title: 'Chat System', done: false },
        { title: 'News Feed', done: false }, { title: 'Rate Limiter', done: false },
      ]},
    ],
  },
  {
    title: 'Full-Stack Web Dev in 8 Weeks',
    description: 'Build production-ready web applications from scratch.',
    category: 'web-dev',
    color: '#22c55e',
    milestones: [
      { title: 'HTML/CSS/JS Foundations', order: 0, tasks: [
        { title: 'Semantic HTML', done: false }, { title: 'Flexbox & Grid', done: false },
        { title: 'ES6+ Features', done: false }, { title: 'DOM Manipulation', done: false },
      ]},
      { title: 'React Essentials', order: 1, tasks: [
        { title: 'Components & Props', done: false }, { title: 'Hooks (useState, useEffect)', done: false },
        { title: 'React Router', done: false }, { title: 'State Management', done: false },
      ]},
      { title: 'Backend & APIs', order: 2, tasks: [
        { title: 'Node.js & Express', done: false }, { title: 'REST API Design', done: false },
        { title: 'MongoDB & Mongoose', done: false }, { title: 'Authentication', done: false },
      ]},
      { title: 'Deployment & DevOps', order: 3, tasks: [
        { title: 'Git & GitHub', done: false }, { title: 'Vercel/Netlify Deploy', done: false },
        { title: 'Docker Basics', done: false },
      ]},
    ],
  },
];

export async function GET(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const templates = searchParams.get('templates');

  if (templates === 'true') {
    return NextResponse.json({ success: true, data: TEMPLATES });
  }

  const filter = { userId: authResult.user.id };
  if (status && status !== 'all') filter.status = status;

  try {
    const roadmaps = await Roadmap.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: roadmaps });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAuth();
  if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  await dbConnect();
  const body = await request.json();

  try {
    // If creating from template
    if (body.templateIndex !== undefined) {
      const template = TEMPLATES[body.templateIndex];
      if (!template) return NextResponse.json({ error: 'Invalid template' }, { status: 400 });

      const weeks = template.milestones.length;
      const start = new Date();
      const target = new Date();
      target.setDate(target.getDate() + weeks * 7);

      const roadmap = await Roadmap.create({
        userId: authResult.user.id,
        ...template,
        startDate: start,
        targetDate: target,
        milestones: template.milestones.map((m, i) => ({
          ...m,
          targetDate: new Date(start.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
          status: 'not-started',
        })),
      });
      return NextResponse.json({ success: true, data: roadmap }, { status: 201 });
    }

    const { title, description, category, targetDate, milestones, color } = body;
    if (!title || !targetDate) {
      return NextResponse.json({ error: 'Title and target date required' }, { status: 400 });
    }

    const roadmap = await Roadmap.create({
      userId: authResult.user.id,
      title, description, category, targetDate: new Date(targetDate),
      color: color || '#ffffff',
      milestones: (milestones || []).map((m, i) => ({
        title: m.title, description: m.description || '',
        targetDate: m.targetDate ? new Date(m.targetDate) : null,
        order: i, status: 'not-started',
        tasks: (m.tasks || []).map(t => ({ title: t.title || t, done: false })),
      })),
    });

    return NextResponse.json({ success: true, data: roadmap }, { status: 201 });
  } catch (err) {
    console.error('Error creating roadmap:', err.message, err.errors ? JSON.stringify(err.errors) : '');
    return NextResponse.json({ error: err.message || 'Failed to create roadmap' }, { status: 500 });
  }
}
