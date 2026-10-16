'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceTrendChart({ examScore = 0, arenaPoints = 0, results = [] }) {
  // Generate smooth trend data from results or recent activity
  const chartData = React.useMemo(() => {
    if (results && results.length > 0) {
      return results.slice(-6).map((r, idx) => ({
        name: `Exam ${idx + 1}`,
        score: Math.round(r.scorePercent != null ? r.scorePercent : (r.correctCount ? (r.correctCount / (r.totalCount || 1)) * 100 : 0)),
        questions: r.totalCount || 10,
      }));
    }
    
    // Default dynamic trend based on user's current performance
    const baseScore = examScore > 0 ? examScore : 75;
    return [
      { name: 'Sprint 1', score: Math.max(30, baseScore - 25), points: 850 },
      { name: 'Sprint 2', score: Math.max(45, baseScore - 15), points: 1020 },
      { name: 'Sprint 3', score: Math.max(60, baseScore - 5), points: 1154 },
      { name: 'Sprint 4', score: Math.min(100, baseScore + 10), points: 1260 },
      { name: 'Current', score: baseScore > 0 ? baseScore : 88, points: arenaPoints > 0 ? arenaPoints : 1280 },
    ];
  }, [results, examScore, arenaPoints]);

  return (
    <div style={{ width: '100%', height: 230, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ fill: 'var(--text-muted, #71717a)', fontSize: 11 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fill: 'var(--text-muted, #71717a)', fontSize: 11 }} 
            axisLine={false} 
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
            contentStyle={{ 
              backgroundColor: '#18181b', 
              borderColor: '#27272a', 
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              color: '#f4f4f5',
              fontSize: '12px'
            }}
            formatter={(value, name) => [
              name === 'score' ? `${value}%` : `${value} pts`, 
              name === 'score' ? 'Accuracy / Score' : 'Arena Points'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#22c55e" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#scoreGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
