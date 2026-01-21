import { useState, KeyboardEvent, useRef } from 'react';
import { FileContext } from '../hooks/useChat';

function PaperclipIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

interface Attachment {
    fileName: string;
    content: string;
}

interface MessageInputProps {
    onSend: (message: string, attachments: Attachment[]) => void;
    disabled?: boolean;
    placeholder?: string;
    fileContext?: FileContext | null;
}

export function MessageInput({ onSend, disabled = false, placeholder = "Type your message...", fileContext }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message, attachments);
            setMessage('');
            setAttachments([]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const newAttachments: Attachment[] = [];
        for (const file of Array.from(files)) {
            if (file.size > 1024 * 1024) continue;
            const text = await file.text();
            newAttachments.push({ fileName: file.name, content: text });
        }
        if (newAttachments.length) {
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (name: string) => {
        setAttachments(prev => prev.filter(a => a.fileName !== name));
    };

    return (
        <div className="border-t p-3 sigil-border space-y-2">
            {fileContext && (
                <div className="flex items-center gap-2 text-xs">
                    <div className="px-2 py-1 rounded sigil-border flex items-center gap-2">
                        <span className="font-medium sigil-muted">{fileContext.isSelection ? 'Selection' : 'File'}:</span>
                        <span className="font-semibold">{fileContext.fileName}</span>
                        {fileContext.isSelection && (
                            <span className="px-2 py-0.5 text-[11px] rounded-full sigil-border">
                                selection
                            </span>
                        )}
                    </div>
                </div>
            )}
            <div className="flex gap-2 items-center flex-wrap">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="sigil-attach-btn shrink-0 w-9 h-9 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors border"
                    title="Attach file"
                    aria-label="Attach file"
                >
                    <PaperclipIcon />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
                {attachments.length > 0 && (
                    <div className="flex gap-1.5 flex-shrink-0 overflow-x-auto max-w-[50%] min-w-0">
                        {attachments.map(att => (
                            <span key={att.fileName} className="sigil-attach-tag inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border flex-shrink-0">
                                {att.fileName}
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(att.fileName)}
                                    className="text-red-500 hover:underline disabled:opacity-50"
                                    disabled={disabled}
                                    aria-label={`Remove ${att.fileName}`}
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 min-w-[140px] resize-none rounded-lg border px-3 py-2 focus:outline-none disabled:opacity-50 sigil-input"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors sigil-button shrink-0"
                >
                    Send
                </button>
            </div>
            <p className="text-xs sigil-muted">Press Enter to send, Shift+Enter for new line</p>
        </div>
    );
}
