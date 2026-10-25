'use client';
import { Clock, Check, X } from 'lucide-react';

export default function ResultPacingBreakdown({ data }) {
  if (data?.testMode !== "oa_blitz" || !data?.questionReview?.length) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h2
        className="card-title"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Clock size={20} style={{ color: "#10b981" }} /> OA Blitz Pacing Analytics
      </h2>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", marginBottom: "1.25rem" }}>
        Speed and time-pressure telemetry per question. Pacing limit was {data.perQuestionTimeLimitSeconds || 60} seconds per question.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {data.questionReview.map((q, idx) => {
          const limit = data.perQuestionTimeLimitSeconds || 60;
          const spent = q.timeSpent != null ? q.timeSpent : Math.round(data.timeTaken / data.totalCount);
          const percent = Math.min(100, Math.round((spent / limit) * 100));
          const isUrgent = spent >= limit * 0.85;

          return (
            <div
              key={idx}
              style={{
                padding: "0.85rem 1rem",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Q{idx + 1}</span>
                  {q.isCorrect ? (
                    <Check size={14} style={{ color: "#10b981" }} />
                  ) : (
                    <X size={14} style={{ color: "#ef4444" }} />
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {q.isTimedOut && (
                    <span style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 700, background: "rgba(239, 68, 68, 0.15)", padding: "1px 6px", borderRadius: "8px" }}>
                      TIMED OUT
                    </span>
                  )}
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, fontFamily: "monospace", color: isUrgent ? "#ef4444" : "var(--text-secondary)" }}>
                    {spent}s / {limit}s
                  </span>
                </div>
              </div>

              <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${percent}%`,
                    background: q.isTimedOut
                      ? "#ef4444"
                      : percent > 75
                      ? "#f59e0b"
                      : "#10b981",
                    borderRadius: "3px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
