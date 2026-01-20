import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
    onSend: (message: string, includeFileContents: boolean) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = "Type your message..." }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [includeFileContents, setIncludeFileContents] = useState(false);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message, includeFileContents);
            setMessage('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t p-4 sigil-border">
            <div className="flex gap-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none rounded-lg border px-3 py-2 focus:outline-none disabled:opacity-50 sigil-input"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors sigil-button"
                >
                    Send
                </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs sigil-muted select-none">
                <input
                    type="checkbox"
                    checked={includeFileContents}
                    onChange={(e) => setIncludeFileContents(e.target.checked)}
                    disabled={disabled}
                />
                Include current file contents in next message
            </label>
            <p className="text-xs sigil-muted mt-1">Press Enter to send, Shift+Enter for new line</p>
        </div>
    );
}
