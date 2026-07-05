"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BrainCircuit, Check, X, ArrowRight, BookOpen } from "lucide-react";

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
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
        );
    }

    if (reviews.length === 0 || completed) {
        return (
            <div className="max-w-2xl mx-auto mt-20 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">You&apos;re all caught up!</h1>
                <p className="text-muted-foreground">You have reviewed all your due items. Come back tomorrow for more spaced repetition.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto mt-10 p-4">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BrainCircuit className="text-primary" />
                    Daily Review
                </h1>
                <div className="text-sm text-muted-foreground font-medium">
                    {currentIndex + 1} / {reviews.length}
                </div>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border shadow-lg overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-8 flex-1 flex items-center justify-center text-center">
                    <div className="space-y-4">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Question</span>
                        <h2 className="text-xl md:text-2xl font-medium leading-relaxed">
                            {currentQuestion.scenario || "Untitled Question"}
                        </h2>
                    </div>
                </div>

                {!showAnswer ? (
                    <div className="p-6 bg-muted/30 border-t flex justify-center">
                        <button 
                            onClick={() => setShowAnswer(true)}
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            Show Answer <EyeIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="border-t animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 bg-muted/10 text-center space-y-4">
                            <span className="text-xs uppercase tracking-widest text-primary font-bold">Answer</span>
                            <div className="text-lg">
                                {currentQuestion.explanation || "No explanation provided."}
                            </div>
                        </div>
                        
                        <div className="p-6 bg-background border-t">
                            <p className="text-center text-sm text-muted-foreground mb-4 font-medium">How well did you know this?</p>
                            <div className="grid grid-cols-4 gap-3">
                                <button 
                                    onClick={() => handleQualitySubmit(0)}
                                    disabled={submitting}
                                    className="p-4 rounded-xl border bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <X className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">Again</span>
                                </button>
                                <button 
                                    onClick={() => handleQualitySubmit(3)}
                                    disabled={submitting}
                                    className="p-4 rounded-xl border bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <span className="text-lg font-bold">😐</span>
                                    <span className="text-xs font-bold uppercase">Hard</span>
                                </button>
                                <button 
                                    onClick={() => handleQualitySubmit(4)}
                                    disabled={submitting}
                                    className="p-4 rounded-xl border bg-green-500/10 hover:bg-green-500/20 text-green-600 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <Check className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">Good</span>
                                </button>
                                <button 
                                    onClick={() => handleQualitySubmit(5)}
                                    disabled={submitting}
                                    className="p-4 rounded-xl border bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <span className="text-lg font-bold">🤩</span>
                                    <span className="text-xs font-bold uppercase">Easy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function EyeIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    )
}
