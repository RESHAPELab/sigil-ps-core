import { useEffect, useRef } from 'react';
import { useChat } from './hooks/useChat';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';

export function ChatApp() {
    const {
        messages,
        loading,
        fileContext,
        error,
        sendMessage,
        submitFeedback,
        getFeedbackStatus,
        getPendingFeedback
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="sigil-root flex flex-col h-full">
            {/* Header */}
            <div className="sigil-border border-b p-4">
                <div>
                    <h1 className="text-lg font-semibold">Sigil Chat</h1>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="border-b p-3 sigil-border" style={{ background: 'var(--sigil-error-bg)' }}>
                    <p className="text-sm" style={{ color: 'var(--sigil-error-fg)' }}>{error}</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <MessageList
                    messages={messages}
                    onFeedback={submitFeedback}
                    getFeedbackStatus={getFeedbackStatus}
                    getPendingFeedback={getPendingFeedback}
                />
                {loading && (
                    <div className="p-4 text-center sigil-muted">
                        <div className="inline-flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Sigil is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput
                onSend={(msg, attachments) => sendMessage(msg, true, attachments)}
                disabled={loading}
                fileContext={fileContext}
            />
        </div>
    );
}
