import { ArrowLeft, Trash2, X } from "lucide-react";

export default function ChatHistorySidebar({ 
    groupedSessions, 
    activeSessionId, 
    sessions, 
    setView, 
    onClose, 
    selectSession, 
    deleteSession 
}) {
    return (
        <>
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
        </>
    );
}
