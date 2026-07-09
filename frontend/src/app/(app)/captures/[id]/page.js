"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Edit3, Loader2 } from "lucide-react";
import CaptureModal from "@/components/CaptureModal";
import RelatedSidebar from "@/components/RelatedSidebar";
import { useCurrentContext } from "@/lib/CurrentContext";

const urgencyLabels = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
};

export default function CaptureDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [capture, setCapture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const { setActiveContext } = useCurrentContext();

    useEffect(() => {
        return () => setActiveContext("");
    }, [setActiveContext]);

    useEffect(() => {
        const loadCapture = async () => {
            try {
                const res = await apiFetch(`/api/captures/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setCapture(data.data);
                    const contentToPass = data.data.description || data.data.rawContent || "No content available.";
                    setActiveContext(`Capture Title: ${data.data.title}\nCapture Content: ${contentToPass}`);
                }
            } catch (err) {
                console.error("Failed to load capture", err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) {
            loadCapture();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="capture-detail-loading">
                <Loader2 size={32} className="spin" />
            </div>
        );
    }

    if (!capture) {
        return (
            <div className="capture-detail-empty">
                Capture not found.
            </div>
        );
    }

    return (
        <div className="capture-detail-page" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <button
                type="button"
                onClick={() => router.back()}
                className="capture-detail-back"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div className="capture-detail-grid">
                <div>
                    <div className="capture-detail-card">
                        <div className="capture-detail-header">
                            <h1 className="capture-detail-title">{capture.title}</h1>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="icon-btn"
                                aria-label="Edit capture"
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>

                        <div className="capture-detail-tags">
                            <span className="badge badge-stark">{capture.category}</span>
                            {capture.urgency !== 'none' && (
                                <span className="capture-urgency-badge">{urgencyLabels[capture.urgency] || capture.urgency}</span>
                            )}
                            {capture.tags?.map(tag => (
                                <span key={tag} className="capture-tag">#{tag}</span>
                            ))}
                        </div>

                        {capture.type === 'screenshot' && capture.imageData && (
                            <div className="capture-detail-image">
                                <img src={capture.imageData} alt="Screenshot" />
                            </div>
                        )}

                        {capture.description && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 className="capture-detail-section-label">Description</h3>
                                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{capture.description}</p>
                            </div>
                        )}

                        {capture.rawContent && (
                            <div>
                                <h3 className="capture-detail-section-label">Content</h3>
                                <div className="capture-detail-content">
                                    {capture.rawContent}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <RelatedSidebar itemId={capture.id || capture._id} type="capture" />
                </div>
            </div>

            <CaptureModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                editingCapture={capture}
                onSave={() => window.location.reload()}
            />
        </div>
    );
}
