'use client';
import { Check, X } from 'lucide-react';

export default function ResultQuestionReview({ questionReview }) {
  if (!questionReview?.length) return null;

  return (
    <>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
        Question Review
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questionReview.map((q, idx) => (
          <div
            key={q._id || idx}
            className="card"
            style={{
              borderColor: q.isCorrect
                ? "var(--border-light)"
                : "var(--border-strong)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  Q{idx + 1}
                </span>
                <span className="badge">{q.module}</span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: q.type === 'MSQ' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: q.type === 'MSQ' ? '#eab308' : '#818cf8',
                    borderColor: q.type === 'MSQ' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                    fontWeight: 700,
                  }}
                >
                  {q.type || 'MCQ'}
                </span>
              </div>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: q.isCorrect
                    ? "var(--text-primary)"
                    : "var(--bg-surface)",
                  color: q.isCorrect
                    ? "var(--bg-primary)"
                    : "var(--text-muted)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                {q.isCorrect ? <Check size={16} /> : <X size={16} />}
              </div>
            </div>
            <p style={{ fontWeight: 500, lineHeight: 1.6, marginBottom: "1rem" }}>
              {q.scenario}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {q.options.map((opt, i) => {
                const isCorrect = q.correctAnswer?.includes(i);
                const wasSelected = q.userAnswer?.includes(i);
                let bg = "transparent";
                let border = "var(--border-light)";
                let opacity = 1;
                if (isCorrect) {
                  bg = "var(--bg-accent)";
                  border = "var(--text-primary)";
                } else if (wasSelected) {
                  opacity = 0.6;
                  border = "var(--text-muted)";
                }
                return (
                  <div
                    key={i}
                    style={{
                      padding: "0.75rem 1rem",
                      border: `1px solid ${border}`,
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: bg,
                      opacity,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>
                      <strong style={{ marginRight: "0.5rem" }}>
                        {String.fromCharCode(65 + i)})
                      </strong>
                      {opt}
                    </span>
                    {isCorrect && <Check size={16} />}
                    {wasSelected && !isCorrect && (
                      <X size={16} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                );
              })}
            </div>
            {q.explanation && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--bg-surface)",
                  borderLeft: "3px solid var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  Explanation
                </strong>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
