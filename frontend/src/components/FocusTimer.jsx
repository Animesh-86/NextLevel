"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, Loader2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function FocusTimer() {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [initialTime, setInitialTime] = useState(25 * 60);

    useEffect(() => {
        window.startFocusTimer = (minutes, taskId) => {
            setIsOpen(true);
            setTimeLeft(minutes * 60);
            setInitialTime(minutes * 60);
            setIsActive(true);
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
            handleStop();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const handleStop = async () => {
        setIsActive(false);
        const focusedSeconds = initialTime - timeLeft;
        if (focusedSeconds < 60) {
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
        <div className="focus-timer">
            <div className="focus-timer-card">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="focus-timer-close"
                    aria-label="Close focus timer"
                >
                    <X size={16} />
                </button>

                <h4 className="focus-timer-title">Focus Session</h4>
                <div className="focus-timer-display">{mins}:{secs}</div>

                <div className="focus-timer-track">
                    <div className="focus-timer-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="focus-timer-actions">
                    <button
                        type="button"
                        onClick={toggleTimer}
                        disabled={isSaving}
                        className="focus-timer-btn focus-timer-btn-primary"
                        aria-label={isActive ? 'Pause' : 'Play'}
                    >
                        {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleStop}
                        disabled={isSaving}
                        className="focus-timer-btn focus-timer-btn-stop"
                        aria-label="Stop and save"
                    >
                        {isSaving ? <Loader2 size={20} className="spin" /> : <Square size={20} fill="currentColor" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
