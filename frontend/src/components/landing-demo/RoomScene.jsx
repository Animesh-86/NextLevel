'use client';

import { Check, Clock, Lightbulb, Swords } from 'lucide-react';
import { Pomo, Score, total, useCountUp, useSteps } from './shared';

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

export const BATTLE = buildBattle();
export const BATTLE_TOTAL_MS = total(BATTLE);

export default function RoomScene({ run, reduced, onDone }) {
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
