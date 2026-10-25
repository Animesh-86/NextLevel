'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Swords, Target, Zap } from 'lucide-react';
import { usePrefersReducedMotion } from './landing-demo/shared';
import RoomScene, { BATTLE_TOTAL_MS } from './landing-demo/RoomScene';
import InterviewScene, { IV_TOTAL_MS } from './landing-demo/InterviewScene';
import AssessScene, { AS_TOTAL_MS } from './landing-demo/AssessScene';
import CommandScene, { CC_TOTAL_MS } from './landing-demo/CommandScene';
import './landing-demo.css';

const TABS = [
  { id: "room", label: "Study Room & OA Blitz", Icon: Swords, ms: BATTLE_TOTAL_MS },
  { id: "interview", label: "AI Mock Interview", Icon: Mic, ms: IV_TOTAL_MS },
  { id: "assess", label: "Smart Assessments", Icon: Target, ms: AS_TOTAL_MS },
  { id: "command", label: "Command Center", Icon: Zap, ms: CC_TOTAL_MS },
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
