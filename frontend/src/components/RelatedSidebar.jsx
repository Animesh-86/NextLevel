"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Map, Link as LinkIcon, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function RelatedSidebar({ itemId, type }) {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRelated = async () => {
            try {
                const res = await apiFetch(`/api/related?itemId=${itemId}&type=${type}`);
                const data = await res.json();
                if (data.success) {
                    setRelated(data.data);
                }
            } catch (err) {
                console.error("Failed to load related items", err);
            } finally {
                setLoading(false);
            }
        };

        if (itemId && type) {
            loadRelated();
        }
    }, [itemId, type]);

    if (loading) {
        return (
            <div className="related-sidebar">
                <h3 className="related-sidebar-title">Related Intelligence</h3>
                <div className="related-sidebar-skeleton">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="related-sidebar-skeleton-row">
                            <div className="related-sidebar-skeleton-avatar" />
                            <div className="related-sidebar-skeleton-lines">
                                <div className="related-sidebar-skeleton-line" />
                                <div className="related-sidebar-skeleton-line short" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (related.length === 0) {
        return null;
    }

    const getIcon = (itemType) => {
        if (itemType === 'roadmap') return <Map size={16} />;
        if (itemType === 'file') return <FileText size={16} />;
        return <LinkIcon size={16} />;
    };

    const getLink = (itemType, id) => {
        if (itemType === 'roadmap') return `/journey/${id}`;
        if (itemType === 'file') return `/vault/${id}`;
        return `/captures/${id}`;
    };

    return (
        <div className="related-sidebar">
            <h3 className="related-sidebar-title">
                <Sparkles size={14} style={{ color: 'var(--text-muted)' }} />
                Related Intelligence
            </h3>
            <div className="related-sidebar-list">
                {related.map(item => (
                    <Link
                        key={item.id}
                        href={getLink(item.type, item.id)}
                        className="related-sidebar-item"
                    >
                        <div className="related-sidebar-icon">
                            {getIcon(item.type)}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p className="related-sidebar-item-title">
                                {item.title || "Untitled"}
                            </p>
                            <p className="related-sidebar-item-meta">
                                {item.type} • {(item.score * 100).toFixed(0)}% match
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
