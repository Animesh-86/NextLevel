"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Bot, Plus, Clock } from "lucide-react";
import { useCurrentContext } from "@/lib/CurrentContext";
import { useAiChat } from "@/lib/hooks/useAiChat";
import ChatHistorySidebar from "./chat/ChatHistorySidebar";
import ChatInputArea from "./chat/ChatInputArea";
import ChatMessageBubble from "./chat/ChatMessageBubble";

export default function AiChatModal({ isOpen, onClose }) {
    const { activeContext } = useCurrentContext();
    const [view, setView] = useState("chat"); // "chat" or "history"
    const messagesEndRef = useRef(null);
    
    const {
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
    } = useAiChat(activeContext);

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

    // Auto-scroll on new messages
    useEffect(() => {
        if (messagesEndRef.current && view === "chat") {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, view]);

    if (!isOpen) return null;

    const sendQuickAction = (text) => {
        setQuery(text);
        submitQuery(text);
    };

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
                                    <ChatMessageBubble 
                                        key={i} 
                                        msg={msg} 
                                        loading={loading} 
                                        onClose={onClose} 
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <ChatInputArea 
                            query={query} 
                            setQuery={setQuery} 
                            loading={loading} 
                            submitQuery={submitQuery} 
                        />
                    </div>
                ) : (
                    // ─── Chat History View ───
                    <div className="ai-chat-main">
                        <ChatHistorySidebar 
                            groupedSessions={groupedSessions}
                            activeSessionId={activeSessionId}
                            sessions={sessions}
                            setView={setView}
                            onClose={onClose}
                            selectSession={selectSession}
                            deleteSession={deleteSession}
                        />
                        <div className="ai-chat-new-chat-footer">
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => {
                                    startNewChat();
                                    setView("chat");
                                }}
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
