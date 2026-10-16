"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeft, BarChart3, Trash, Zap, Clock, AlertTriangle } from "lucide-react";
import { SkeletonCard, SkeletonText } from "@/components/SkeletonLoader";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
export default function ResultReview({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await apiFetch(`/api/results/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch result:", err);
      }
      setLoading(false);
    }
    fetchResult();
  }, [id]);

  const handleDeleteResult = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/results/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push("/test?tab=results");
      }
    } catch (err) {
      console.error("Failed to delete result:", err);
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div style={{ animation: "fadeIn 0.5s ease-out" }}>
        {" "}
        <SkeletonCard height="160px" />{" "}
        <div style={{ marginTop: "1.5rem" }}>
          <SkeletonText lines={5} />
        </div>{" "}
      </div>
    );
  }
  if (!data) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--text-muted)",
        }}
      >
        {" "}
        Result not found. <br />{" "}
        <button
          className="btn btn-secondary"
          onClick={() => router.push("/test?tab=results")}
          style={{ marginTop: "1rem" }}
        >
          {" "}
          Back to Exam Results{" "}
        </button>{" "}
      </div>
    );
  }
  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      {" "}
      <ConfirmModal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteResult}
        title="Delete this exam result?"
        message="This will permanently remove this result from your history. This action cannot be undone."
        confirmText={deleting ? "Deleting..." : "Delete Result"}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <button
          onClick={() => router.push("/test?tab=results")}
          className="btn btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {" "}
          <ArrowLeft size={16} /> Back to Exam Results{" "}
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#ef4444",
            borderColor: "#ef4444"
          }}
        >
          <Trash size={16} /> Delete Result
        </button>
      </div>{" "}
      {/* Score Summary */}{" "}
      <div className="card" style={{ marginBottom: "2rem" }}>
        {" "}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {" "}
          <div>
            {" "}
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
            </h1>{" "}
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {" "}
              {new Date(data.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
            </p>{" "}
          </div>{" "}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {" "}
            <span
              style={{
                fontSize: "3rem",
                fontWeight: 900,
                letterSpacing: "-0.05em",
              }}
            >
              {Math.round(data.scorePercent)}%
            </span>{" "}
            <span
              className={`badge ${data.passed ? "badge-stark" : ""}`}
              style={{ fontSize: "0.9rem", padding: "0.4rem 0.8rem" }}
            >
              {" "}
              {data.passed ? "PASSED" : "FAILED"}{" "}
            </span>{" "}
          </div>{" "}
        </div>{" "}
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
          {" "}
          <div style={{ textAlign: "center" }}>
            {" "}
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {data.correctCount}
            </div>{" "}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Correct
            </div>{" "}
          </div>{" "}
          <div style={{ textAlign: "center" }}>
            {" "}
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              {data.wrongCount}
            </div>{" "}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Wrong
            </div>{" "}
          </div>{" "}
          <div style={{ textAlign: "center" }}>
            {" "}
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              {data.skippedCount}
            </div>{" "}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Skipped
            </div>{" "}
          </div>{" "}
          <div style={{ textAlign: "center" }}>
            {" "}
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              {data.totalCount}
            </div>{" "}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Total
            </div>{" "}
          </div>{" "}
          {data.timeTaken > 0 && (
            <div style={{ textAlign: "center" }}>
              {" "}
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {data.timeTaken < 60 ? `${data.timeTaken}s` : `${Math.round(data.timeTaken / 60)}m`}
              </div>{" "}
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Time Taken
              </div>{" "}
            </div>
          )}{" "}
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
        </div>{" "}
      </div>{" "}
      {/* OA Blitz Pacing Breakdown */}{" "}
      {data.testMode === "oa_blitz" && data.questionReview?.length > 0 && (
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
      )}{" "}
      {/* Module Breakdown */}{" "}
      {data.moduleBreakdown?.length > 0 && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          {" "}
          <h2
            className="card-title"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {" "}
            <BarChart3 size={20} /> Module Breakdown{" "}
          </h2>{" "}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {" "}
            {data.moduleBreakdown.map((mod) => (
              <div key={mod.module}>
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  {" "}
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {mod.module}
                  </span>{" "}
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {mod.percent}% ({mod.correct}/{mod.total})
                  </span>{" "}
                </div>{" "}
                <div
                  style={{
                    height: "8px",
                    backgroundColor: "var(--bg-accent)",
                    borderRadius: "var(--radius-full)",
                    overflow: "hidden",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      height: "100%",
                      width: `${mod.percent}%`,
                      backgroundColor: "var(--text-primary)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 1s ease-out",
                    }}
                  />{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Question-by-Question Review */}{" "}
      <h2
        style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}
      >
        Question Review
      </h2>{" "}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {" "}
        {data.questionReview?.map((q, idx) => (
          <div
            key={q._id}
            className="card"
            style={{
              borderColor: q.isCorrect
                ? "var(--border-light)"
                : "var(--border-strong)",
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              {" "}
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                {" "}
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  Q{idx + 1}
                </span>{" "}
                <span className="badge">{q.module}</span>{" "}
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
                </span>{" "}
              </div>{" "}
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
                {" "}
                {q.isCorrect ? <Check size={16} /> : <X size={16} />}{" "}
              </div>{" "}
            </div>{" "}
            <p
              style={{ fontWeight: 500, lineHeight: 1.6, marginBottom: "1rem" }}
            >
              {q.scenario}
            </p>{" "}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {" "}
              {q.options.map((opt, i) => {
                const isCorrect = q.correctAnswer.includes(i);
                const wasSelected = q.userAnswer.includes(i);
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
                    {" "}
                    <span>
                      {" "}
                      <strong style={{ marginRight: "0.5rem" }}>
                        {String.fromCharCode(65 + i)})
                      </strong>{" "}
                      {opt}{" "}
                    </span>{" "}
                    {isCorrect && <Check size={16} />}{" "}
                    {wasSelected && !isCorrect && (
                      <X size={16} style={{ color: "var(--text-muted)" }} />
                    )}{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
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
                {" "}
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
                </strong>{" "}
                {q.explanation}{" "}
              </div>
            )}{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
