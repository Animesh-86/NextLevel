"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, Loader2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function FocusTimer() {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins default
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [initialTime, setInitialTime] = useState(25 * 60);

    useEffect(() => {
        // Expose a global method to start the timer from anywhere (e.g. planner)
        window.startFocusTimer = (minutes, taskId) => {
            setIsOpen(true);
            setTimeLeft(minutes * 60);
            setInitialTime(minutes * 60);
            setIsActive(true);
            // Optionally store taskId if we want to log it
            window._currentFocusTaskId = taskId;
        };
        return () => {
            delete window.startFocusTimer;
        };
    }, []);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            handleStop(); // Auto save when done
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const handleStop = async () => {
        setIsActive(false);
        const focusedSeconds = initialTime - timeLeft;
        if (focusedSeconds < 60) {
            // Less than a minute, don't save
            setIsOpen(false);
            return;
        }

        setIsSaving(true);
        try {
            const durationMinutes = Math.floor(focusedSeconds / 60);
            const taskId = window._currentFocusTaskId;
            
            const res = await apiFetch("/api/study/session", {
                method: "POST",
                body: JSON.stringify({ durationMinutes, taskId })
            });
            const data = await res.json();
            
            if (data.success && window.showGamificationToast) {
                const xp = Math.floor(durationMinutes / 5) * 5;
                if (xp > 0) {
                    window.showGamificationToast(xp, `Completed ${durationMinutes}m focus!`);
                }
            }
        } catch (err) {
            console.error("Failed to log study session", err);
        } finally {
            setIsSaving(false);
            setIsOpen(false);
            window._currentFocusTaskId = null;
        }
    };

    if (!isOpen) return null;

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    const progress = ((initialTime - timeLeft) / initialTime) * 100;

    return (
        <div className="fixed bottom-24 right-4 z-[90] animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="bg-card text-card-foreground p-4 rounded-2xl shadow-xl border w-64 relative overflow-hidden group">
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
                
                <h4 className="font-semibold text-sm mb-2 text-center">Focus Session</h4>
                <div className="text-4xl font-mono font-bold text-center mb-4 tracking-tighter">
                    {mins}:{secs}
                </div>
                
                <div className="h-1 w-full bg-muted rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex justify-center gap-2">
                    <button 
                        onClick={toggleTimer}
                        disabled={isSaving}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <button 
                        onClick={handleStop}
                        disabled={isSaving}
                        className="p-3 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
