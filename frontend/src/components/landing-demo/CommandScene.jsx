'use client';

import { Check, Flame, Sparkles } from 'lucide-react';
import { total, useCountUp, useSteps } from './shared';

const CC = [
  { ms: 1700, reveal: 1, done: 0 },
  { ms: 1400, reveal: 2, done: 0 },
  { ms: 1400, reveal: 3, done: 0 },
  { ms: 1100, reveal: 3, done: 1 },
  { ms: 1100, reveal: 3, done: 2 },
  { ms: 3000, reveal: 3, done: 3 },
];
const TASKS = ["Review IoT week 1 notes", "Run a 25m focus session", "Practice weak topic: Edge computing"];

export const CC_TOTAL_MS = total(CC);

export default function CommandScene({ run, reduced, onDone }) {
  const f = useSteps(CC, run, reduced, onDone);
  const streak = 2 + (f.done > 0 ? 1 : 0);
  const xp = useCountUp(220 + f.done * 20, reduced, 220);
  const exam = useCountUp(72, reduced, 0, 900);
  const iv = useCountUp(81, reduced, 0, 900);
  const focus = Math.round((f.done / 3) * 25);

  return (
    <div className="s-cc">
      <div className="cc-top">
        <div>
          <small className="ld-mu">Today</small>
          <h3>Good afternoon, Alex</h3>
        </div>
        <div className="ld-badges ld-rel">
          <span key={streak} className="ld-badge amber ld-pop">
            <Flame size={12} aria-hidden /> {streak}-day streak
          </span>
          <span className="ld-badge">Level 4 · {xp} XP</span>
          {f.done > 0 && (
            <span key={f.done} className="ld-float ld-green ld-toast">
              +{20} XP
            </span>
          )}
        </div>
      </div>

      <div className="cc-kpis">
        <div className="ld-card ld-pad ld-in" style={{ animationDelay: "0ms" }}>
          <span className="ld-mu">Practice exams</span>
          <b className="cc-big">{exam}%</b>
          <small className="ld-green">Up 6 points this week</small>
        </div>
        <div className="ld-card ld-pad ld-in" style={{ animationDelay: "120ms" }}>
          <span className="ld-mu">AI interviews</span>
          <b className="cc-big">{iv}%</b>
          <small className="ld-green">Strong hire signal</small>
        </div>
        <div className="ld-card ld-pad ld-in" style={{ animationDelay: "240ms" }}>
          <span className="ld-mu">Focus today</span>
          <b className="cc-big">
            {focus}
            <em> of 25 min</em>
          </b>
          <div className="ld-track">
            <i style={{ width: `${(focus / 25) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="ld-grid">
        <section className={`ld-card ld-pad cc-hide${f.reveal >= 2 ? " show" : ""}`}>
          <div className="ld-lab">
            <span>
              <Sparkles size={13} aria-hidden /> Daily briefing
            </span>
          </div>
          <p className="cc-brief">
            Your Edge computing score is the weakest topic this week. A 25-minute focus block on it keeps your streak
            safe and lifts your next assessment.
          </p>
        </section>

        <section className={`ld-card ld-pad cc-hide${f.reveal >= 3 ? " show" : ""}`}>
          <div className="ld-lab">
            <span>Tasks for today</span>
            <b className={f.done === 3 ? "ld-green" : "ld-mu"}>{f.done === 3 ? "Day complete" : `${f.done}/3 done`}</b>
          </div>
          {TASKS.map((t, i) => (
            <div key={t} className={`cc-task${i < f.done ? " done" : ""}`}>
              <span className="cc-box">{i < f.done && <Check size={12} aria-hidden />}</span>
              {t}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
