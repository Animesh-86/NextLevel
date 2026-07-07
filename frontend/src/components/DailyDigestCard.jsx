"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function DailyDigestCard() {
    const [digest, setDigest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDigest = async () => {
            try {
                const res = await apiFetch("/api/digest/today");
                const data = await res.json();
                if (data.success) {
                    setDigest(data.data);
                }
            } catch (err) {
                console.error("Failed to load digest", err);
            } finally {
                setLoading(false);
            }
        };
        loadDigest();
    }, []);

    if (loading) {
        return (
            <div className="dash-briefing dash-briefing-loading">
                <div className="dash-briefing-glow" aria-hidden />
                <div className="dash-briefing-body">
                    <div className="dash-digest-skeleton">
                        <div className="dash-digest-skeleton-line" />
                        <div className="dash-digest-skeleton-line short" />
                    </div>
                </div>
            </div>
        );
    }

    if (!digest) return null;

    const chips = [
        digest.taskCount != null && { label: 'Tasks today', value: digest.taskCount },
        digest.streak > 0 && { label: 'Streak', value: `${digest.streak}d` },
        digest.reminderCount > 0 && { label: 'Reminders', value: digest.reminderCount },
    ].filter(Boolean);

    return (
        <div className="dash-briefing">
            <div className="dash-briefing-glow" aria-hidden />
            <div className="dash-briefing-accent" aria-hidden />
            <div className="dash-briefing-body">
                <div className="dash-briefing-header">
                    <div className="dash-briefing-label">
                        <Sparkles size={14} />
                        <span>Daily Briefing</span>
                    </div>
                    {chips.length > 0 && (
                        <div className="dash-briefing-chips">
                            {chips.map((chip) => (
                                <span key={chip.label} className="dash-briefing-chip">
                                    <span className="dash-briefing-chip-val">{chip.value}</span>
                                    {chip.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <p className="dash-briefing-message">{digest.message}</p>
            </div>
        </div>
    );
}
