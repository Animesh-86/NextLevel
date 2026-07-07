"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";

export default function GamificationToast() {
    const [toast, setToast] = useState(null);

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
        <div className="gamification-toast">
            <div className="gamification-toast-card">
                <div className="gamification-toast-icon">
                    <Award size={20} />
                </div>
                <div>
                    <h4 className="gamification-toast-title">+{toast.xp} XP</h4>
                    <p className="gamification-toast-message">{toast.message}</p>
                </div>
            </div>
        </div>
    );
}
