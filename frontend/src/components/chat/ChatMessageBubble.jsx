import { Bot, User, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ChatMessageBubble({ msg, loading, onClose }) {
    return (
        <div className={`ai-chat-row ${msg.role === "user" ? "ai-chat-row-user" : ""}`}>
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
    );
}
