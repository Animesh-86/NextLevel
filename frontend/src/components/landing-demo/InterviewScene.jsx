'use client';

import { Camera, Eye, Mic, Sparkles } from 'lucide-react';
import { total, useCountUp, useSteps, Wave } from './shared';

const IV = [
  { ms: 3000, phase: "ask", lines: 0 },
  { ms: 900, phase: "listen", lines: 0 },
  { ms: 1400, phase: "listen", lines: 1 },
  { ms: 1400, phase: "listen", lines: 2 },
  { ms: 1400, phase: "listen", lines: 3 },
  { ms: 1400, phase: "think", lines: 3 },
  { ms: 4600, phase: "score", lines: 3 },
];

const IV_Q =
  "Your resume lists an order service built on Kafka. How did you keep consumer lag under control during peak traffic?";
const IV_A = [
  "I partitioned the topic by customer ID so related events stayed in order,",
  "scaled consumers using the lag metric from Prometheus,",
  "and made writes idempotent so retries never double-charged anyone.",
];
const IV_SCORES = [
  ["Technical depth", 84],
  ["System design", 76],
  ["Communication", 88],
  ["Resume credibility", 81],
];

export const IV_TOTAL_MS = total(IV);

export default function InterviewScene({ run, reduced, onDone }) {
  const f = useSteps(IV, run, reduced, onDone);
  const asking = f.phase === "ask";
  const listening = f.phase === "listen";
  const scoring = f.phase === "score";
  const overall = useCountUp(scoring ? 81 : 0, reduced, 0, 900);

  return (
    <div className="s-iv">
      <header className="ld-card ld-head">
        <span className="ld-tile">
          <Mic size={18} aria-hidden />
        </span>
        <div>
          <div className="ld-title">Backend Engineer (Java / Spring Boot)</div>
          <div className="ld-sub">Mid-level · 30 min · questions grounded in your resume</div>
        </div>
        <div className="ld-badges">
          <span className="ld-badge ok">
            <Camera size={12} aria-hidden /> Camera proctoring
          </span>
          <span className="ld-badge ok">
            <Eye size={12} aria-hidden /> Gaze on screen
          </span>
        </div>
      </header>

      <div className="ld-grid iv-grid">
        <section className="ld-card ld-pad">
          <div className="ld-who">
            <span className="ld-avatar">
              <Sparkles size={16} aria-hidden />
            </span>
            <div>
              <b>AI staff engineer</b>
              <small>{asking ? "Speaking" : "Listening"}</small>
            </div>
            <Wave on={asking} />
          </div>
          <p className="ld-ask">{IV_Q}</p>
          <span className="ld-tag">Verifying: Kafka order service</span>
        </section>

        <section className="ld-card ld-pad">
          <div className="ld-who">
            <span className="ld-avatar me">AM</span>
            <div>
              <b>You</b>
              <small>{listening ? "Answering" : "Ready"}</small>
            </div>
            <Wave on={listening} tone="amber" />
          </div>
          <div className="ld-trans" aria-label="Live transcript">
            {IV_A.slice(0, f.lines).map((l) => (
              <p key={l}>{l}</p>
            ))}
            {f.phase === "think" && (
              <p className="ld-think">
                Analyzing answer<span className="ld-dots" aria-hidden />
              </p>
            )}
          </div>
        </section>

        <section className={`ld-card ld-pad ld-scorecard${scoring ? " on" : ""}`} aria-hidden={!scoring}>
          <div className="ld-lab">
            <span>Scorecard</span>
            <span className="ld-badge ok">Strong hire signal</span>
          </div>
          <div className="ld-overall">
            <b>{overall}%</b>
            <small>Overall</small>
          </div>
          <div className="ld-meters">
            {IV_SCORES.map(([label, v]) => (
              <div key={label} className="ld-meter">
                <span>{label}</span>
                <b>{scoring ? v : 0}%</b>
                <div className="ld-track">
                  <i style={{ width: `${scoring ? v : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
