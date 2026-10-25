'use client';
import { Award } from 'lucide-react';

const STATIC_ACHIEVEMENTS = [
  { id: 'first_exam', title: 'First Exam', description: 'Completed your first exam' },
  { id: 'streak_7', title: '7-Day Streak', description: 'Practiced 7 days in a row' },
  { id: 'first_interview', title: 'First Mock Interview', description: 'Completed your first AI mock interview' },
  { id: 'interview_ace', title: 'Interview Ace', description: 'Scored 80%+ on an AI mock interview' },
  { id: 'interview_veteran', title: 'Staff Ready', description: 'Completed 5+ technical mock interviews' },
  { id: 'perfect', title: 'Perfect Score', description: 'Scored 100% on an exam' },
  { id: '100_questions', title: 'Century', description: 'Answered 100 questions' },
  { id: '10_passed', title: 'Champion', description: 'Passed 10 exams' },
  { id: 'streak_30', title: 'Monthly Warrior', description: '30-day streak' },
  { id: '500_questions', title: 'Scholar', description: 'Answered 500 questions' },
  { id: '10_hours', title: 'Dedicated', description: '10+ hours of study' }
];

export default function ProfileAchievements({ profile, interviews = [] }) {
  const userAchievements = profile?.achievements || [];

  return (
    <section className="glass-panel" style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <Award size={18} />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Achievements</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
        {STATIC_ACHIEVEMENTS.map((a) => {
          const isUnlocked = userAchievements.some(ua => ua.id === a.id) ||
            (a.id === 'first_interview' && interviews.length >= 1) ||
            (a.id === 'interview_ace' && interviews.some(i => (i.scorecard?.overallScore || 0) >= 80)) ||
            (a.id === 'interview_veteran' && interviews.length >= 5);
          return (
            <div key={a.id} style={{
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isUnlocked ? 'var(--brand)' : 'var(--border-light)'}`,
              background: isUnlocked ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: isUnlocked ? 1 : 0.4
            }}>
              <div style={{ 
                fontSize: '1.5rem', 
                background: isUnlocked ? 'var(--brand)' : 'rgba(255,255,255,0.05)', 
                padding: '8px', 
                borderRadius: '50%', 
                color: isUnlocked ? 'var(--bg-primary)' : 'var(--text-muted)' 
              }}>
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {a.description}
                </div>
              </div>
            </div>
          );
        })}
        {userAchievements.filter(ua => !STATIC_ACHIEVEMENTS.some(s => s.id === ua.id)).map(a => (
          <div key={a.id} style={{
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--brand)',
              background: 'rgba(var(--brand-rgb), 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{ fontSize: '1.5rem', background: 'var(--brand)', padding: '8px', borderRadius: '50%', color: 'var(--bg-primary)' }}>
                {a.icon ? <span>{a.icon}</span> : <Award size={24} />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title || a.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.description || a.desc}</div>
              </div>
            </div>
        ))}
      </div>
    </section>
  );
}
