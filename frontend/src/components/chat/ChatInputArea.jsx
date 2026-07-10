import { Send } from "lucide-react";

export default function ChatInputArea({ query, setQuery, loading, submitQuery }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        submitQuery(query);
    };

    return (
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
    );
}
