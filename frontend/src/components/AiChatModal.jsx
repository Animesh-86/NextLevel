"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function AiChatModal({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userQ = query.trim();
        setQuery("");
        setMessages(prev => [...prev, { role: "user", content: userQ }]);
        setLoading(true);

        const newBotMsgIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: "bot", content: "", sources: [] }]);

        try {
            // 1. Fetch sources first
            const sourcesRes = await apiFetch(`/api/chat/sources?query=${encodeURIComponent(userQ)}`);
            const sourcesData = await sourcesRes.json();
            
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newBotMsgIndex].sources = sourcesData.data || [];
                return newMsgs;
            });

            // 2. Stream answer
            const response = await apiFetch(`/api/chat/stream?query=${encodeURIComponent(userQ)}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // SSE chunks are prefixed with "data:"
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
                newMsgs[newBotMsgIndex].content = "Sorry, I encountered an error searching your knowledge base.";
                return newMsgs;
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-2xl h-[80vh] rounded-xl border shadow-lg flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Ask Your Knowledge Base</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-4">
                            <Bot className="w-12 h-12 text-primary/50" />
                            <p>Ask anything about your notes, files, and roadmaps.<br/>I&apos;ll find the answers and cite my sources.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                                {msg.role === "bot" && (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-lg p-3 ${
                                    msg.role === "user" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted text-foreground"
                                }`}>
                                    {msg.role === "bot" && !msg.content && loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                                    )}

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map(src => (
                                                    <Link key={src.id} href={`/captures/${src.id}`} onClick={onClose}
                                                        className="text-xs px-2 py-1 rounded bg-background border hover:border-primary transition-colors">
                                                        {src.title || "Untitled"}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about your notes..."
                            className="w-full bg-muted border-none rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="absolute right-1 top-1 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
