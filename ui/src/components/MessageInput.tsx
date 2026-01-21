import { useState, KeyboardEvent, useRef } from 'react';
import { FileContext } from '../hooks/useChat';

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
            <div className="flex gap-2 items-start">
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
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors sigil-border text-xs flex items-center justify-center"
                        title="Attach file"
                    >
                        📎
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={disabled || !message.trim()}
                        className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors sigil-button"
                    >
                        Send
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                </div>
            </div>
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                    {attachments.map(att => (
                        <span key={att.fileName} className="px-2 py-1 rounded sigil-border flex items-center gap-2">
                            {att.fileName}
                            <button
                                onClick={() => removeAttachment(att.fileName)}
                                className="text-red-500 hover:underline"
                                disabled={disabled}
                            >
                                ✕
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <p className="text-xs sigil-muted">Press Enter to send, Shift+Enter for new line</p>
        </div>
    );
}
