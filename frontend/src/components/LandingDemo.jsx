'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Clock,
  Eye,
  FileText,
  Flame,
  Lightbulb,
  Mic,
  Sparkles,
  Swords,
  Target,
  Zap,
} from 'lucide-react';
import './landing-demo.css';

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const f = () => setReduced(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return reduced;
}

/**
 * Walks through a list of frames, each shown for `frame.ms`.
 * Pauses while `run` is false, calls `onDone` after the last frame.
 * With reduced motion it shows the final frame and never advances.
 */
function useSteps(frames, run, reduced, onDone) {
  const [i, setI] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reduced || !run) return;
    const t = setTimeout(() => {
      if (i < frames.length - 1) setI(i + 1);
      else doneRef.current?.();
    }, frames[i].ms);
    return () => clearTimeout(t);
  }, [i, run, reduced, frames]);

  return frames[reduced ? frames.length - 1 : i];
}

function useCountUp(target, reduced, initial = target, ms = 700) {
  const [v, setV] = useState(initial);
  const from = useRef(initial);
  useEffect(() => {
    if (reduced) {
      from.current = target;
      setV(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now) => {
      const k = Math.min((now - start) / ms, 1);
      const val = Math.round(a + (target - a) * (1 - Math.pow(1 - k, 3)));
      from.current = val;
      setV(val);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, ms]);
  return v;
}

const total = (frames) => frames.reduce((s, f) => s + f.ms, 0);

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

function Wave({ on, tone = 'muted' }) {
  return (
    <span className={`ld-wave ${tone}${on ? ' on' : ''}`} aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

function Pomo({ active }) {
  const [s, setS] = useState(24 * 60 + 58);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [active]);
  return (
    <b className="ld-mono ld-amber">
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </b>
  );
}

function Score({ value, start, reduced }) {
  const v = useCountUp(value, reduced, start);
  return <b className="ld-pt">{v} pts</b>;
}

/* ------------------------------------------------------------------ */
/* Scene 1: Study room and OA Blitz boss battle                        */
/* ------------------------------------------------------------------ */

// t and ok are indexed by player: [You, Sarah, David, Priya]
const QS = [
  {
    q: "Which approach finds the maximum subarray sum in strictly O(N) time and O(1) space?",
    o: [
      "Kadane's algorithm (DP state keeping max ending here)",
      "Divide and conquer tree traversal with 3-way split",
      "2D grid DP with memoized cache",
    ],
    c: 0,
    t: [4.2, 1.4, 2.4, 3.1],
    ok: [1, 1, 1, 0],
  },
  {
    q: "What is the time complexity of building a heap from an unsorted array of N elements?",
    o: ["O(N log N)", "O(N)", "O(log N)"],
    c: 1,
    t: [4.4, 1.1, 2.9, 2.2],
    ok: [1, 1, 0, 1],
  },
  {
    q: "Which structure gives O(1) average lookup by key?",
    o: ["Balanced BST", "Hash table", "Sorted array with binary search"],
    c: 1,
    t: [3.8, 1.8, 2.1, 3.4],
    ok: [1, 1, 1, 1],
  },
  {
    q: "Which technique avoids recomputing overlapping subproblems?",
    o: ["Memoization", "Brute-force recursion", "Greedy choice"],
    c: 0,
    t: [4.0, 1.2, 2.6, 3.0],
    ok: [1, 1, 1, 1],
  },
];

const NAMES = ["You (Alex M.)", "Sarah K. (Senior SWE)", "David L. (MIT)", "Priya R. (Staff Eng)"];
const START = [420, 380, 310, 260];
const BOSS_START = 650;
const ANSWER_ORDER = [1, 2, 3, 0]; // who answers first, second, ...
const RANKS = ["1st", "2nd", "3rd", "4th"];

function buildBattle() {
  const frames = [];
  let scores = [...START];
  let hp = BOSS_START;
  QS.forEach((q, r) => {
    const last = r === QS.length - 1;
    for (let a = 0; a <= 4; a++) {
      frames.push({
        ms: a === 0 ? 1100 : 750,
        round: r,
        answered: a,
        reveal: false,
        scores: [...scores],
        hp,
        gains: [0, 0, 0, 0],
        dmg: 0,
        win: false,
      });
    }
    const gains = q.ok.map((ok, i) => (ok ? 100 + Math.round((10 - q.t[i]) * 6) : 0));
    const correct = q.ok.filter(Boolean).length;
    const dmg = last ? hp : Math.min(correct * 60, hp);
    scores = scores.map((s, i) => s + gains[i]);
    hp -= dmg;
    frames.push({
      ms: last ? 3000 : 2400,
      round: r,
      answered: 4,
      reveal: true,
      scores: [...scores],
      hp,
      gains,
      dmg,
      win: last,
    });
  });
  return frames;
}
const BATTLE = buildBattle();

function RoomScene({ run, reduced, onDone }) {
  const f = useSteps(BATTLE, run, reduced, onDone);
  const q = QS[f.round];
  const hp = useCountUp(f.hp, reduced, BOSS_START);
  const order = [0, 1, 2, 3].sort((a, b) => f.scores[b] - f.scores[a]);
  const answeredIds = ANSWER_ORDER.slice(0, f.answered);

  return (
    <div className="s-room">
      <header className="ld-card ld-head">
        <span className="ld-tile">
          <Swords size={18} aria-hidden />
        </span>
        <div>
          <div className="ld-title">
            Room NL-8821: Dynamic Programming Raid <span className="ld-badge amber">Boss battle</span>
          </div>
          <div className="ld-sub">4 engineers connected · 25m synchronized focus</div>
        </div>
      </header>

      <div className="ld-grid">
        <section className="ld-card ld-pad ld-rel">
          <div className="ld-lab">
            <span>{f.win ? "Boss defeated" : "Raid boss: the O(2^N) monster"}</span>
            <b className="ld-amber">{hp} / 1000 HP</b>
          </div>
          <div className="ld-hp">
            <i className={f.reveal && f.dmg > 0 ? "hit" : ""} style={{ width: `${f.hp / 10}%` }} />
          </div>
          {f.reveal && f.dmg > 0 && (
            <span key={`d${f.round}`} className="ld-float ld-red ld-dmg">
              -{f.dmg}
            </span>
          )}
          <div className="ld-round">
            <span>Round {f.round + 2} of 5</span>
            <span className="ld-round-bullet">•</span>
            <span>sprint question</span>
          </div>
          <p className="ld-q" key={f.round}>
            {q.q}
          </p>
          <div className="ld-opts">
            {q.o.map((t, i) => {
              let cls = "ld-opt";
              if (i === q.c && f.reveal) cls += " is-right";
              else if (i === q.c && f.answered >= 4) cls += " is-picked";
              return (
                <div key={t} className={cls}>
                  {t}
                </div>
              );
            })}
          </div>
          <div className="ld-hint">
            <Lightbulb size={13} className="ld-amber" aria-hidden />
            {f.win
              ? "Raid complete. Final ranking locked in."
              : "Select the optimal algorithm to deal damage and climb the leaderboard."}
          </div>
        </section>

        <section className="ld-card ld-pad">
          <div className="ld-lab">
            <span>Live participants (4)</span>
            <b className="ld-green">Synced</b>
          </div>
          <div className="ld-rows">
            {NAMES.map((n, i) => {
              const rank = order.indexOf(i);
              return (
                <div key={n} className={`ld-row${i === 0 ? " me" : ""}`} style={{ top: rank * 52 }}>
                  <span className="ld-rk">{RANKS[rank]}</span>
                  <span className="ld-nm">{n}</span>
                  <Check
                    size={14}
                    className={`ld-ans${answeredIds.includes(i) && !f.reveal ? " on" : ""}`}
                    aria-hidden
                  />
                  <Score value={f.scores[i]} start={START[i]} reduced={reduced} />
                  {f.reveal && f.gains[i] > 0 && (
                    <span key={f.round} className="ld-float ld-green ld-gain">
                      +{f.gains[i]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ld-pom">
            <Clock size={14} aria-hidden />
            <span>25m Pomodoro round</span>
            <Pomo active={run && !reduced} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2: AI mock interview                                          */
/* ------------------------------------------------------------------ */

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

function InterviewScene({ run, reduced, onDone }) {
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

/* ------------------------------------------------------------------ */
/* Scene 3: smart assessments                                          */
/* ------------------------------------------------------------------ */

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

function AssessScene({ run, reduced, onDone }) {
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

/* ------------------------------------------------------------------ */
/* Scene 4: command center (dashboard)                                 */
/* ------------------------------------------------------------------ */

const CC = [
  { ms: 1700, reveal: 1, done: 0 },
  { ms: 1400, reveal: 2, done: 0 },
  { ms: 1400, reveal: 3, done: 0 },
  { ms: 1100, reveal: 3, done: 1 },
  { ms: 1100, reveal: 3, done: 2 },
  { ms: 3000, reveal: 3, done: 3 },
];
const TASKS = ["Review IoT week 1 notes", "Run a 25m focus session", "Practice weak topic: Edge computing"];

function CommandScene({ run, reduced, onDone }) {
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

/* ------------------------------------------------------------------ */
/* Shell: window chrome, tabs, auto-advance                            */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "room", label: "Study Room & OA Blitz", Icon: Swords, ms: total(BATTLE) },
  { id: "interview", label: "AI Mock Interview", Icon: Mic, ms: total(IV) },
  { id: "assess", label: "Smart Assessments", Icon: Target, ms: total(AS) },
  { id: "command", label: "Command Center", Icon: Zap, ms: total(CC) },
];

export default function LandingDemo() {
  const reduced = usePrefersReducedMotion();
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const [replay, setReplay] = useState(0);
  const [inView, setInView] = useState(true);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef(null);

  // Only run while the demo is on screen and the tab is visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const f = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  const run = inView && !hidden;

  const onDone = useCallback(() => {
    if (auto) setTab((t) => (t + 1) % TABS.length);
    else setReplay((n) => n + 1);
  }, [auto]);

  const choose = (i) => {
    setTab(i);
    setAuto(false);
    setReplay((n) => n + 1);
  };

  const sceneProps = { run, reduced, onDone };
  const key = `${tab}-${replay}`;

  return (
    <div className="ld" ref={rootRef} id="dashboard">
      <div className="ld-chrome">
        <span className="ld-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <div className="ld-tabs" role="tablist" aria-label="Product demo">
          {TABS.map(({ id, label, Icon, ms }, i) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === i}
              className={`ld-tab${tab === i ? " is-on" : ""}`}
              onClick={() => choose(i)}
            >
              <Icon size={14} aria-hidden />
              <span>{label}</span>
              {tab === i && auto && !reduced && (
                <i
                  key={key}
                  className="ld-prog"
                  style={{ animationDuration: `${ms}ms`, animationPlayState: run ? "running" : "paused" }}
                />
              )}
            </button>
          ))}
        </div>
        {auto ? (
          <span className="ld-live">
            <i /> Live demo
          </span>
        ) : (
          <button type="button" className="ld-resume" onClick={() => setAuto(true)}>
            Resume tour
          </button>
        )}
      </div>

      <div className="ld-body" role="tabpanel">
        {tab === 0 && <RoomScene key={key} {...sceneProps} />}
        {tab === 1 && <InterviewScene key={key} {...sceneProps} />}
        {tab === 2 && <AssessScene key={key} {...sceneProps} />}
        {tab === 3 && <CommandScene key={key} {...sceneProps} />}
      </div>
    </div>
  );
}

export { LandingDemo };
