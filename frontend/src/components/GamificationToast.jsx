"use client";

import { useEffect, useState } from "react";
import { Award, Zap } from "lucide-react";

export default function GamificationToast() {
    const [toast, setToast] = useState(null);

    // In a real implementation, this would listen to a global state, context, or SSE
    // For this prototype, we'll expose a global window method
    useEffect(() => {
        window.showGamificationToast = (xp, message) => {
            setToast({ xp, message, id: Date.now() });
            setTimeout(() => setToast(null), 3000);
        };
        return () => {
            delete window.showGamificationToast;
        };
    }, []);

    if (!toast) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-full animate-pulse">
                    <Zap className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                    <h4 className="font-bold text-lg">+{toast.xp} XP</h4>
                    <p className="text-sm opacity-90">{toast.message}</p>
                </div>
            </div>
        </div>
    );
}
