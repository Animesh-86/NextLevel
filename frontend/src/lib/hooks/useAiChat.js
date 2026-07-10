import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";

export function useAiChat(activeContext) {
    const [query, setQuery] = useState("");
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [loading, setLoading] = useState(false);

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
    }, []);

    // Save sessions to localStorage
    const saveSessions = (updatedSessions) => {
        setSessions(updatedSessions);
        if (typeof window !== "undefined") {
            localStorage.setItem("nextlevel_chats", JSON.stringify(updatedSessions));
        }
    };

    // Active session messages helper
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId) || null;
    }, [sessions, activeSessionId]);

    const messages = useMemo(() => {
        return activeSession ? activeSession.messages : [];
    }, [activeSession]);

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
    };

    const submitQuery = async (textToSubmit) => {
        const userQ = textToSubmit.trim();
        if (!userQ) return;

        setQuery("");
        setLoading(true);

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

        const userMessage = { role: "user", content: userQ };
        sessionToUpdate.messages = [...sessionToUpdate.messages, userMessage];
        
        const newBotMsgIndex = sessionToUpdate.messages.length;
        const botMessage = { role: "bot", content: "", sources: [] };
        sessionToUpdate.messages = [...sessionToUpdate.messages, botMessage];

        saveSessions(currentSessions);
        setActiveSessionId(currentSessionId);

        try {
            const sourcesRes = await apiFetch(`/api/chat/sources?query=${encodeURIComponent(userQ)}`);
            const sourcesData = await sourcesRes.json();

            currentSessions = currentSessions.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = [...s.messages];
                    msgs[newBotMsgIndex] = { ...msgs[newBotMsgIndex], sources: sourcesData.data || [] };
                    return { ...s, messages: msgs, date: new Date().toISOString() };
                }
                return s;
            });
            saveSessions(currentSessions);

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
                        
                        setSessions(prev => {
                            const updated = prev.map(s => {
                                if (s.id === currentSessionId) {
                                    const msgs = s.messages.map((msg, idx) => 
                                        idx === newBotMsgIndex 
                                            ? { ...msg, content: msg.content + text } 
                                            : msg
                                    );
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

    return {
        query,
        setQuery,
        sessions,
        activeSessionId,
        loading,
        messages,
        groupedSessions,
        startNewChat,
        deleteSession,
        selectSession,
        submitQuery
    };
}
