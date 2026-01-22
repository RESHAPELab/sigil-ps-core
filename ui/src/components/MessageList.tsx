import { ChatMessage } from '../hooks/useChat';
import { FeedbackButton } from './FeedbackButton';

interface MessageListProps {
    messages: ChatMessage[];
    onFeedback: (messageId: string, rating: 'good' | 'bad', reason: string) => void;
    getFeedbackStatus: (messageId: string) => { rating: 'good' | 'bad', submitted: boolean } | null;
    getPendingFeedback: (messageId: string) => boolean;
}

export function MessageList({ messages, onFeedback, getFeedbackStatus, getPendingFeedback }: MessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full sigil-muted">
                <div className="text-center">
                    <p className="text-lg mb-2">Welcome to Sigil Chat!</p>
                    <p className="text-sm">Start a conversation by typing a message below.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                                ? 'sigil-button'
                                : 'sigil-input'
                        }`}
                    >
                        <div className="whitespace-pre-wrap break-words">
                            {message.role === 'assistant' ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownContent content={message.content} />
                                </div>
                            ) : (
                                <p>{message.content}</p>
                            )}
                        </div>
                        {/* Display attachments for user messages */}
                        {message.role === 'user' && message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-opacity-20">
                                <div className="text-xs font-medium mb-1 opacity-75">Attached files:</div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {message.attachments.map((att, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border opacity-75">
                                            {att.fileName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {message.role === 'assistant' && (() => {
                            const feedbackStatus = getFeedbackStatus(message.id);
                            const isPending = getPendingFeedback(message.id);
                            console.log('MessageList render - messageId:', message.id, 'feedbackStatus:', feedbackStatus, 'isPending:', isPending);
                            return (
                                <div className="mt-2">
                                    <FeedbackButton
                                        messageId={message.id}
                                        onFeedback={onFeedback}
                                        feedbackSubmitted={feedbackStatus?.submitted || false}
                                        feedbackRating={feedbackStatus?.rating}
                                        isSubmitting={isPending}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Simple markdown renderer for code blocks and basic formatting
function MarkdownContent({ content }: { content: string }) {
    // Split content into parts (code blocks and regular text)
    const parts: Array<{ type: 'code' | 'text'; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex, match.index)
            });
        }
        
        // Add code block
        parts.push({
            type: 'code',
            language: match[1] || '',
            content: match[2]
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({
            type: 'text',
            content: content.substring(lastIndex)
        });
    }
    
    // If no code blocks found, return all as text
    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }

    return (
        <div>
            {parts.map((part, index) => {
                if (part.type === 'code') {
                    return (
                        <pre
                            key={index}
                            className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded overflow-x-auto my-2"
                        >
                            <code className={`language-${part.language}`}>
                                {part.content}
                            </code>
                        </pre>
                    );
                } else {
                    // Simple text rendering with line breaks
                    return (
                        <div key={index} className="whitespace-pre-wrap">
                            {part.content.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    {i < part.content.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    );
                }
            })}
        </div>
    );
}
