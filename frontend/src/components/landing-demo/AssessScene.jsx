'use client';

import { FileText, Target } from 'lucide-react';
import { total, useCountUp, useSteps, Wave } from './shared';

const af = (phase, ms, o = {}) => ({
  phase,
  ms,
  progress: 100,
  gen: 5,
  sel: false,
  reveal: false,
  score: 0,
  ...o,
});

const AS = [
  af("parse", 350, { progress: 0, gen: 0 }),
  af("parse", 1500, { progress: 100, gen: 0 }),
  af("generate", 650, { gen: 1 }),
  af("generate", 650, { gen: 2 }),
  af("generate", 650, { gen: 3 }),
  af("generate", 650, { gen: 4 }),
  af("generate", 650, { gen: 5 }),
  af("take", 1600),
  af("take", 1000, { sel: true }),
  af("take", 1400, { sel: true, reveal: true }),
  af("result", 400),
  af("result", 4600, { score: 80 }),
];

const AS_QS = [
  ["Which protocol suits low-power sensors sending small telemetry messages?", "MQTT basics"],
  ["What does an ADC convert?", "Sensors and ADC"],
  ["Where should latency-critical filtering run?", "Edge computing"],
  ["What does QoS 1 guarantee in MQTT?", "MQTT basics"],
  ["Why debounce a mechanical sensor input?", "Sensors and ADC"],
];
const AS_OPTS = ["HTTP polling over REST", "MQTT with QoS 0 or 1", "FTP batch upload"];
const AS_TOPICS = [
  ["MQTT basics", 100],
  ["Sensors and ADC", 75],
  ["Edge computing", 50],
];
const RING = 2 * Math.PI * 34;

export const AS_TOTAL_MS = total(AS);

export default function AssessScene({ run, reduced, onDone }) {
  const f = useSteps(AS, run, reduced, onDone);
  const score = useCountUp(f.score, reduced, 0, 1000);
  const status =
    f.phase === "parse"
      ? "Parsing 12 pages…"
      : f.phase === "generate"
        ? "Generating questions…"
        : "Test ready: 10 questions";

  return (
    <div className="s-as">
      <header className="ld-card ld-head">
        <span className="ld-tile">
          <Target size={18} aria-hidden />
        </span>
        <div>
          <div className="ld-title">Smart assessment from your own notes</div>
          <div className="ld-sub">Upload a document, get a timed test and a topic-level breakdown</div>
        </div>
      </header>

      <div className="ld-grid">
        <section className="ld-card ld-pad">
          <div className="ld-doc">
            <span className="ld-tile sm">
              <FileText size={16} aria-hidden />
            </span>
            <div>
              <b>IoT week 1</b>
              <small>12 pages · in your vault</small>
            </div>
          </div>
          <div className="ld-lab" style={{ marginTop: 12 }}>
            <span>{status}</span>
            <b className="ld-amber">{f.progress}%</b>
          </div>
          <div className="ld-hp">
            <i style={{ width: `${f.progress}%` }} />
          </div>
          <div className="ld-genlist">
            {AS_QS.slice(0, f.gen).map(([q, tag]) => (
              <div key={q} className="ld-gen">
                <span>{q}</span>
                <span className="ld-tag">{tag}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ld-card ld-pad ld-rel">
          {(f.phase === "parse" || f.phase === "generate") && (
            <div className="ld-wait" key="wait">
              <p>Building a 10-question test from your notes</p>
              <Wave on tone="amber" />
            </div>
          )}

          {f.phase === "take" && (
            <div className="ld-take" key="take">
              <div className="ld-lab">
                <span>Question 1 of 10</span>
                <b className="ld-amber">30s per question</b>
              </div>
              <div className="ld-hp">
                <i className="ld-timer" />
              </div>
              <p className="ld-q left">{AS_QS[0][0]}</p>
              <div className="ld-opts">
                {AS_OPTS.map((o, i) => {
                  let cls = "ld-opt";
                  if (f.reveal && i === 1) cls += " is-right";
                  else if (f.sel && i === 1) cls += " is-picked";
                  return (
                    <div key={o} className={cls}>
                      {o}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {f.phase === "result" && (
            <div className="ld-result" key="result">
              <div className="ld-ringwrap">
                <svg viewBox="0 0 80 80" width="100" height="100" role="img" aria-label={`Score ${f.score} percent`}>
                  <circle cx="40" cy="40" r="34" className="ld-ring-bg" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="ld-ring"
                    strokeDasharray={RING}
                    strokeDashoffset={RING * (1 - f.score / 100)}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <b>{score}%</b>
              </div>
              <div className="ld-meters">
                {AS_TOPICS.map(([label, v]) => (
                  <div key={label} className="ld-meter">
                    <span>{label}</span>
                    <b className={v < 60 ? "ld-red" : ""}>{f.score ? v : 0}%</b>
                    <div className="ld-track">
                      <i className={v < 60 ? "weak" : ""} style={{ width: `${f.score ? v : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="ld-cta" tabIndex={-1}>
                Practice weak topics
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
