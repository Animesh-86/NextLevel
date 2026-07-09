"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useCurrentContext } from "@/lib/CurrentContext";

export default function AiChatModal({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { activeContext } = useCurrentContext();

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const sendQuickAction = (text) => {
        setQuery(text);
        // We need to wait for state to update, or just pass text directly to a new internal submit
        // Since handleSubmit uses event, we can't easily fake it, let's just trigger it manually
        submitQuery(text);
    };

    const submitQuery = async (textToSubmit) => {
        const userQ = textToSubmit.trim();
        if (!userQ) return;
        
        setQuery("");
        setMessages(prev => [...prev, { role: "user", content: userQ }]);
        setLoading(true);

        const newBotMsgIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: "bot", content: "", sources: [] }]);

        try {
            const sourcesRes = await apiFetch(`/api/chat/sources?query=${encodeURIComponent(userQ)}`);
            const sourcesData = await sourcesRes.json();

            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newBotMsgIndex].sources = sourcesData.data || [];
                return newMsgs;
            });

            const requestBody = {
                query: userQ,
                context: activeContext || null,
                history: messages.map(m => ({ role: m.role, content: m.content }))
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
                        setMessages(prev => {
                            const newMsgs = [...prev];
                            newMsgs[newBotMsgIndex].content += text;
                            return newMsgs;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => {
                const newMsgs = [...prev];
                if (err.message && err.message.includes("401")) {
                    newMsgs[newBotMsgIndex].content = "⚠️ You are unauthorized. Your login session may have expired or a stale cookie was detected. Please log out, clear your cookies, and log back in.";
                } else if (err.status === 401) {
                    newMsgs[newBotMsgIndex].content = "⚠️ You are unauthorized. Your login session may have expired or a stale cookie was detected. Please log out, clear your cookies, and log back in.";
                } else {
                    newMsgs[newBotMsgIndex].content = "Sorry, I encountered an error. Please try again later.";
                }
                return newMsgs;
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
                <div className="ai-chat-header">
                    <div className="ai-chat-header-title">
                        <Sparkles size={18} style={{ color: 'var(--text-muted)' }} />
                        Ask Your Knowledge Base
                    </div>
                    <button type="button" onClick={onClose} className="icon-btn" aria-label="Close chat">
                        <X size={18} />
                    </button>
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
        </div>
    );
}
