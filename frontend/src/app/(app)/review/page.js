"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BrainCircuit, Check, X, Eye, Loader2 } from "lucide-react";

export default function ReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        async function loadReviews() {
            try {
                const res = await apiFetch("/api/reviews/due?limit=20");
                const data = await res.json();
                if (data.success) {
                    setReviews(data.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadReviews();
    }, []);

    const currentQuestion = reviews[currentIndex];

    const handleQualitySubmit = async (quality) => {
        setSubmitting(true);
        try {
            const res = await apiFetch("/api/reviews/submit", {
                method: "POST",
                body: JSON.stringify({
                    questionId: currentQuestion.id,
                    quality: quality
                })
            });
            const data = await res.json();

            if (data.success && window.showGamificationToast && quality >= 3) {
                window.showGamificationToast(10, "Review Completed!");
            }

            if (currentIndex < reviews.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setShowAnswer(false);
            } else {
                setCompleted(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="review-loading">
                <Loader2 size={32} className="spin" />
            </div>
        );
    }

    if (reviews.length === 0 || completed) {
        return (
            <div className="review-empty" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div className="review-empty-icon">
                    <Check size={40} />
                </div>
                <h1 className="review-empty-title">You&apos;re all caught up!</h1>
                <p className="review-empty-text">
                    You have reviewed all your due items. Come back tomorrow for more spaced repetition.
                </p>
            </div>
        );
    }

    return (
        <div className="review-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="review-header">
                <h1 className="review-title">
                    <BrainCircuit size={22} />
                    Daily Review
                </h1>
                <div className="review-progress">
                    {currentIndex + 1} / {reviews.length}
                </div>
            </div>

            <div className="review-card">
                <div className="review-question">
                    <div>
                        <span className="review-question-label">Question</span>
                        <h2 className="review-question-text">
                            {currentQuestion.scenario || "Untitled Question"}
                        </h2>
                    </div>
                </div>

                {!showAnswer ? (
                    <div className="review-footer">
                        <button
                            type="button"
                            onClick={() => setShowAnswer(true)}
                            className="btn btn-primary"
                        >
                            Show Answer <Eye size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="review-answer-section">
                        <div className="review-answer-body">
                            <span className="review-answer-label">Answer</span>
                            <div className="review-answer-text">
                                {currentQuestion.explanation || "No explanation provided."}
                            </div>
                        </div>

                        <div className="review-rating">
                            <p className="review-rating-label">How well did you know this?</p>
                            <div className="review-rating-grid">
                                <button
                                    type="button"
                                    onClick={() => handleQualitySubmit(0)}
                                    disabled={submitting}
                                    className="review-rating-btn"
                                >
                                    <X size={20} />
                                    <span>Again</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQualitySubmit(3)}
                                    disabled={submitting}
                                    className="review-rating-btn"
                                >
                                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>~</span>
                                    <span>Hard</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQualitySubmit(4)}
                                    disabled={submitting}
                                    className="review-rating-btn"
                                >
                                    <Check size={20} />
                                    <span>Good</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQualitySubmit(5)}
                                    disabled={submitting}
                                    className="review-rating-btn"
                                >
                                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>+</span>
                                    <span>Easy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
