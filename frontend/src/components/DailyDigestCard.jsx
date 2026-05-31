"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle, Clock, Map, Flame, Loader2 } from "lucide-react";
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
            <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm mb-8 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20"></div>
                    <div className="h-6 w-1/3 bg-muted rounded"></div>
                </div>
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-5/6 bg-muted rounded"></div>
                    <div className="h-4 w-4/6 bg-muted rounded"></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-muted rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!digest) return null;

    return (
        <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 transition-transform duration-700 group-hover:scale-110"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Your Daily Briefing</h2>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-6 text-muted-foreground whitespace-pre-wrap">
                    {digest.message}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background rounded-lg p-3 border flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{digest.taskCount}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasks Today</p>
                        </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-2xl font-bold">{digest.reminderCount}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reminders</p>
                        </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border flex items-center space-x-3">
                        <Map className="w-5 h-5 text-blue-500" />
                        <div>
                            <p className="text-2xl font-bold">Active</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Roadmaps</p>
                        </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border flex items-center space-x-3">
                        <Flame className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-2xl font-bold">{digest.streak}</p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Day Streak</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
