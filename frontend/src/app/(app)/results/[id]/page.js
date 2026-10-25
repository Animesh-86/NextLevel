"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash } from "lucide-react";
import { SkeletonCard, SkeletonText } from "@/components/SkeletonLoader";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";
import ResultScoreHero from "./components/ResultScoreHero";
import ResultPacingBreakdown from "./components/ResultPacingBreakdown";
import ResultModuleBreakdown from "./components/ResultModuleBreakdown";
import ResultQuestionReview from "./components/ResultQuestionReview";

export default function ResultReview({ params }) {
  const routeParams = useParams();
  const id = routeParams?.id || (params && typeof params.then !== 'function' ? params?.id : null);
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
        <SkeletonCard height="160px" />
        <div style={{ marginTop: "1.5rem" }}>
          <SkeletonText lines={5} />
        </div>
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
        Result not found. <br />
        <button
          className="btn btn-secondary"
          onClick={() => router.push("/test?tab=results")}
          style={{ marginTop: "1rem" }}
        >
          Back to Exam Results
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
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
          <ArrowLeft size={16} /> Back to Exam Results
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
      </div>

      {/* Score Summary */}
      <ResultScoreHero data={data} />

      {/* OA Blitz Pacing Breakdown */}
      <ResultPacingBreakdown data={data} />

      {/* Module Breakdown */}
      <ResultModuleBreakdown moduleBreakdown={data.moduleBreakdown} />

      {/* Question-by-Question Review */}
      <ResultQuestionReview questionReview={data.questionReview} />
    </div>
  );
}
