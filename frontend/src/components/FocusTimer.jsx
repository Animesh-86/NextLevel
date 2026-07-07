"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, Loader2, X, Maximize2, Minimize2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function FocusTimer() {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [intent, setIntent] = useState("");

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

    if (isFullscreen) {
        return (
            <div className="focus-timer-fullscreen" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
                zIndex: 9999, display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
                <button onClick={() => setIsFullscreen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <Minimize2 size={24} />
                </button>
                <div style={{ fontSize: '10rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {mins}:{secs}
                </div>
                {intent && (
                    <div style={{ marginTop: '2rem', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                        Focusing on: <span style={{ color: 'white' }}>{intent}</span>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '4rem' }}>
                    <button className="btn btn-primary" onClick={toggleTimer} style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isActive ? <Pause size={28} /> : <Play size={28} />}
                    </button>
                    <button className="btn btn-secondary" onClick={handleStop} disabled={isSaving} style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSaving ? <Loader2 className="spin" size={24} /> : <Square size={24} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="focus-timer">
            <div className="focus-timer-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 className="focus-timer-title" style={{ margin: 0 }}>Focus Session</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => setIsFullscreen(true)} className="icon-btn" aria-label="Fullscreen">
                            <Maximize2 size={14} />
                        </button>
                        <button type="button" onClick={() => setIsOpen(false)} className="icon-btn" aria-label="Close focus timer">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                
                {!isActive && timeLeft === initialTime && (
                    <input 
                        type="text" 
                        placeholder="What are you focusing on?" 
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        className="input"
                        style={{ marginBottom: '12px', fontSize: '12px', padding: '6px 8px' }}
                    />
                )}

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
