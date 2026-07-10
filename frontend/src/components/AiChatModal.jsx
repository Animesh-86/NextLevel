"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, Send, Bot, User, Loader2, Plus, Trash2, Clock, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useCurrentContext } from "@/lib/CurrentContext";

export default function AiChatModal({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("chat"); // "chat" or "history"
    const messagesEndRef = useRef(null);
    const { activeContext } = useCurrentContext();

    // Adjust main content layout when chat panel is open
    useEffect(() => {
        if (typeof document !== "undefined") {
            const mainContent = document.querySelector(".main-content");
            if (mainContent) {
                if (isOpen) {
                    mainContent.classList.add("chat-open");
                } else {
                    mainContent.classList.remove("chat-open");
                }
            }
        }
        return () => {
            if (typeof document !== "undefined") {
                const mainContent = document.querySelector(".main-content");
                if (mainContent) {
                    mainContent.classList.remove("chat-open");
                }
            }
        };
    }, [isOpen]);

    // Load sessions from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("nextlevel_chats");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setSessions(parsed);
                    if (parsed.length > 0) {
                        setActiveSessionId(parsed[0].id);
                    }
                } catch (e) {
                    console.error("Failed to parse chats from localStorage", e);
                }
            }
        }
    }, [isOpen]);

    // Active session messages helper
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId) || null;
    }, [sessions, activeSessionId]);

    const messages = useMemo(() => {
        return activeSession ? activeSession.messages : [];
    }, [activeSession]);

    // Save sessions to localStorage
    const saveSessions = (updatedSessions) => {
        setSessions(updatedSessions);
        if (typeof window !== "undefined") {
            localStorage.setItem("nextlevel_chats", JSON.stringify(updatedSessions));
        }
    };

    // Auto-scroll on new messages
    useEffect(() => {
        if (messagesEndRef.current && view === "chat") {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);

    // Group sessions by date
    const groupedSessions = useMemo(() => {
        const today = [];
        const yesterday = [];
        const last7Days = [];
        const older = [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        
        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

        sessions.forEach(s => {
            const sDate = new Date(s.date);
            if (sDate >= startOfToday) {
                today.push(s);
            } else if (sDate >= startOfYesterday) {
                yesterday.push(s);
            } else if (sDate >= startOf7DaysAgo) {
                last7Days.push(s);
            } else {
                older.push(s);
            }
        });

        return { today, yesterday, last7Days, older };
    }, [sessions]);

    const startNewChat = () => {
        const newSession = {
            id: "session-" + Date.now(),
            title: "New Chat",
            date: new Date().toISOString(),
            messages: []
        };
        const updated = [newSession, ...sessions];
        setActiveSessionId(newSession.id);
        saveSessions(updated);
        setView("chat");
    };

    const deleteSession = (id, e) => {
        e.stopPropagation();
        const updated = sessions.filter(s => s.id !== id);
        saveSessions(updated);
        
        if (activeSessionId === id) {
            if (updated.length > 0) {
                setActiveSessionId(updated[0].id);
            } else {
                setActiveSessionId(null);
            }
        }
    };

    const selectSession = (id) => {
        setActiveSessionId(id);
        setView("chat");
    };

    const sendQuickAction = (text) => {
        setQuery(text);
        submitQuery(text);
    };

    const submitQuery = async (textToSubmit) => {
        const userQ = textToSubmit.trim();
        if (!userQ) return;

        setQuery("");
        setLoading(true);

        // Ensure we have an active session
        let currentSessionId = activeSessionId;
        let currentSessions = [...sessions];
        let sessionToUpdate = currentSessions.find(s => s.id === currentSessionId);

        if (!sessionToUpdate) {
            const newSession = {
                id: "session-" + Date.now(),
                title: userQ.length > 30 ? userQ.substring(0, 30) + "..." : userQ,
                date: new Date().toISOString(),
                messages: []
            };
            currentSessions = [newSession, ...currentSessions];
            currentSessionId = newSession.id;
            sessionToUpdate = newSession;
        } else if (sessionToUpdate.title === "New Chat") {
            sessionToUpdate.title = userQ.length > 30 ? userQ.substring(0, 30) + "..." : userQ;
        }

        // 1. Add User Message
        const userMessage = { role: "user", content: userQ };
        sessionToUpdate.messages = [...sessionToUpdate.messages, userMessage];
        
        // 2. Add empty Bot Message placeholder
        const newBotMsgIndex = sessionToUpdate.messages.length;
        const botMessage = { role: "bot", content: "", sources: [] };
        sessionToUpdate.messages = [...sessionToUpdate.messages, botMessage];

        // Save immediately to render user bubble & bot loading indicator
        saveSessions(currentSessions);
        setActiveSessionId(currentSessionId);

        try {
            // Fetch Sources
            const sourcesRes = await apiFetch(`/api/chat/sources?query=${encodeURIComponent(userQ)}`);
            const sourcesData = await sourcesRes.json();

            // Update sources in list
            currentSessions = currentSessions.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = [...s.messages];
                    msgs[newBotMsgIndex] = { ...msgs[newBotMsgIndex], sources: sourcesData.data || [] };
                    return { ...s, messages: msgs, date: new Date().toISOString() };
                }
                return s;
            });
            saveSessions(currentSessions);

            // Stream response
            const requestBody = {
                query: userQ,
                context: activeContext || null,
                history: sessionToUpdate.messages.slice(0, -2).map(m => ({ role: m.role, content: m.content }))
            };

            const response = await apiFetch('/api/chat/stream', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const text = line.substring(5);
                        
                        // Update bot message content piece by piece
                        setSessions(prev => {
                            const updated = prev.map(s => {
                                if (s.id === currentSessionId) {
                                    const msgs = s.messages.map((m, idx) => {
                                        if (idx === newBotMsgIndex) {
                                            return { ...m, content: m.content + text };
                                        }
                                        return m;
                                    });
                                    return { ...s, messages: msgs };
                                }
                                return s;
                            });
                            if (typeof window !== "undefined") {
                                localStorage.setItem("nextlevel_chats", JSON.stringify(updated));
                            }
                            return updated;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Chat error:", err);
            setSessions(prev => {
                const updated = prev.map(s => {
                    if (s.id === currentSessionId) {
                        const msgs = s.messages.map((m, idx) => {
                            if (idx === newBotMsgIndex) {
                                let errMsg = "Sorry, I encountered an error. Please try again later.";
                                if (err.message && err.message.includes("401")) {
                                    errMsg = "⚠️ You are unauthorized. Your login session may have expired or a stale cookie was detected. Please log out, clear your cookies, and log back in.";
                                }
                                return { ...m, content: errMsg };
                            }
                            return m;
                        });
                        return { ...s, messages: msgs };
                    }
                    return s;
                });
                if (typeof window !== "undefined") {
                    localStorage.setItem("nextlevel_chats", JSON.stringify(updated));
                }
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitQuery(query);
    };

    if (!isOpen) return null;

    return (
        <div className="ai-chat-overlay" onClick={onClose}>
            <div className="ai-chat-modal" onClick={(e) => e.stopPropagation()}>
                
                {view === "chat" ? (
                    // ─── Main Chat View ───
                    <div className="ai-chat-main">
                        <div className="ai-chat-header">
                            <div className="ai-chat-header-title">
                                <Sparkles size={18} style={{ color: 'var(--text-muted)' }} />
                                Ask Your Knowledge Base
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setView("history")} 
                                    className="icon-btn" 
                                    title="View chat history"
                                >
                                    <Clock size={18} />
                                </button>
                                <button type="button" onClick={onClose} className="icon-btn" aria-label="Close chat">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="ai-chat-messages">
                            {messages.length === 0 ? (
                                <div className="ai-chat-empty">
                                    <Bot size={40} style={{ color: 'var(--text-muted)' }} />
                                    <p>
                                        Ask anything about your notes, files, and roadmaps.
                                        <br />
                                        I&apos;ll find the answers and cite my sources.
                                    </p>
                                    {activeContext && (
                                        <div className="ai-chat-quick-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            <button onClick={() => sendQuickAction("Explain the page I am currently looking at like I am 5 years old.")} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                                                Explain Like I'm 5
                                            </button>
                                            <button onClick={() => sendQuickAction("Generate 5 practice flashcard questions based on the page I am currently looking at.")} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                                                Generate Flashcards
                                            </button>
                                            <button onClick={() => sendQuickAction("Quiz me on this page with 3 multiple choice questions.")} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                                                Quiz Me
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={`ai-chat-row ${msg.role === "user" ? "ai-chat-row-user" : ""}`}>
                                        {msg.role === "bot" && (
                                            <div className="ai-chat-avatar">
                                                <Bot size={14} />
                                            </div>
                                        )}
                                        <div className={`ai-chat-bubble ${msg.role === "user" ? "ai-chat-bubble-user" : "ai-chat-bubble-bot"}`}>
                                            {msg.role === "bot" && !msg.content && loading ? (
                                                <Loader2 size={16} className="spin" />
                                            ) : (
                                                msg.content
                                            )}

                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="ai-chat-sources">
                                                    <p className="ai-chat-sources-label">Sources</p>
                                                    <div className="ai-chat-sources-list">
                                                        {msg.sources.map(src => (
                                                            <Link
                                                                key={src.id}
                                                                href={`/captures/${src.id}`}
                                                                onClick={onClose}
                                                                className="ai-chat-source-link"
                                                            >
                                                                {src.title || "Untitled"}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="ai-chat-avatar">
                                                <User size={14} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSubmit} className="ai-chat-form">
                            <div className="ai-chat-input-wrap">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask about your notes..."
                                    className="ai-chat-input"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="ai-chat-send"
                                    aria-label="Send message"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // ─── Chat History View (Replaced inside same 400px panel) ───
                    <div className="ai-chat-main">
                        <div className="ai-chat-header">
                            <div className="ai-chat-header-title">
                                <button 
                                    type="button" 
                                    onClick={() => setView("chat")} 
                                    className="icon-btn" 
                                    style={{ marginRight: '8px' }}
                                    title="Back to chat"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                Chat History
                            </div>
                            <button type="button" onClick={onClose} className="icon-btn" aria-label="Close chat">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="ai-chat-history-container">
                            {/* Group: Today */}
                            {groupedSessions.today.length > 0 && (
                                <div>
                                    <h3 className="ai-chat-group-title">Today</h3>
                                    <div className="ai-chat-session-list">
                                        {groupedSessions.today.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`ai-chat-session-item ${s.id === activeSessionId ? "active" : ""}`}
                                                onClick={() => selectSession(s.id)}
                                            >
                                                <span className="ai-chat-session-title">{s.title}</span>
                                                <button 
                                                    type="button" 
                                                    className="ai-chat-session-delete" 
                                                    onClick={(e) => deleteSession(s.id, e)}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group: Yesterday */}
                            {groupedSessions.yesterday.length > 0 && (
                                <div>
                                    <h3 className="ai-chat-group-title">Yesterday</h3>
                                    <div className="ai-chat-session-list">
                                        {groupedSessions.yesterday.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`ai-chat-session-item ${s.id === activeSessionId ? "active" : ""}`}
                                                onClick={() => selectSession(s.id)}
                                            >
                                                <span className="ai-chat-session-title">{s.title}</span>
                                                <button 
                                                    type="button" 
                                                    className="ai-chat-session-delete" 
                                                    onClick={(e) => deleteSession(s.id, e)}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group: Last 7 Days */}
                            {groupedSessions.last7Days.length > 0 && (
                                <div>
                                    <h3 className="ai-chat-group-title">Previous 7 Days</h3>
                                    <div className="ai-chat-session-list">
                                        {groupedSessions.last7Days.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`ai-chat-session-item ${s.id === activeSessionId ? "active" : ""}`}
                                                onClick={() => selectSession(s.id)}
                                            >
                                                <span className="ai-chat-session-title">{s.title}</span>
                                                <button 
                                                    type="button" 
                                                    className="ai-chat-session-delete" 
                                                    onClick={(e) => deleteSession(s.id, e)}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group: Older */}
                            {groupedSessions.older.length > 0 && (
                                <div>
                                    <h3 className="ai-chat-group-title">Older</h3>
                                    <div className="ai-chat-session-list">
                                        {groupedSessions.older.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`ai-chat-session-item ${s.id === activeSessionId ? "active" : ""}`}
                                                onClick={() => selectSession(s.id)}
                                            >
                                                <span className="ai-chat-session-title">{s.title}</span>
                                                <button 
                                                    type="button" 
                                                    className="ai-chat-session-delete" 
                                                    onClick={(e) => deleteSession(s.id, e)}
                                                    title="Delete chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sessions.length === 0 && (
                                <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No chat history yet.
                                </div>
                            )}
                        </div>

                        <div className="ai-chat-new-chat-footer">
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={startNewChat}
                            >
                                <Plus size={16} />
                                Start New Chat
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
