'use client';

export default function ResultScoreHero({ data }) {
  if (!data) return null;

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span>{data.exam?.title || "Exam Review"}</span>
            {data.testMode === "oa_blitz" && (
              <span
                className="badge"
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                OA Blitz ({data.perQuestionTimeLimitSeconds || 60}s/Q)
              </span>
            )}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {new Date(data.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              fontSize: "3rem",
              fontWeight: 900,
              letterSpacing: "-0.05em",
            }}
          >
            {Math.round(data.scorePercent)}%
          </span>
          <span
            className={`badge ${data.passed ? "badge-stark" : ""}`}
            style={{ fontSize: "0.9rem", padding: "0.4rem 0.8rem" }}
          >
            {data.passed ? "PASSED" : "FAILED"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {data.correctCount}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Correct
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {data.wrongCount}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Wrong
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {data.skippedCount}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Skipped
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {data.totalCount}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Total
          </div>
        </div>
        {data.timeTaken > 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              {data.timeTaken < 60 ? `${data.timeTaken}s` : `${Math.round(data.timeTaken / 60)}m`}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Time Taken
            </div>
          </div>
        )}
        {data.speedAccuracyRatio != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>
              {data.speedAccuracyRatio}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Correct/Min
            </div>
          </div>
        )}
        {data.timedOutQuestionIds?.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444" }}>
              {data.timedOutQuestionIds.length}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Timeouts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
