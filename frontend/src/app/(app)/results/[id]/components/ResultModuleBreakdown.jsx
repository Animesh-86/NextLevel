'use client';
import { BarChart3 } from 'lucide-react';

export default function ResultModuleBreakdown({ moduleBreakdown }) {
  if (!moduleBreakdown?.length) return null;

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h2
        className="card-title"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <BarChart3 size={20} /> Module Breakdown
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {moduleBreakdown.map((mod) => (
          <div key={mod.module}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                {mod.module}
              </span>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {mod.percent}% ({mod.correct}/{mod.total})
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: "var(--bg-accent)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${mod.percent}%`,
                  backgroundColor: "var(--text-primary)",
                  borderRadius: "var(--radius-full)",
                  transition: "width 1s ease-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
