import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { FileContext, Attachment } from '../hooks/useChat';
import { vscodeApi, setupMessageListener, VSCodeMessage } from '../utils/vscodeApi';

function PaperclipIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

interface MessageInputProps {
    onSend: (message: string, attachments: Attachment[]) => void;
    disabled?: boolean;
    placeholder?: string;
    fileContext?: FileContext | null;
    attachments: Attachment[];
    pickFiles: () => void;
    removeAttachment: (fileName: string) => void;
}

export function MessageInput({ onSend, disabled = false, placeholder = "Type your message...", fileContext, attachments, pickFiles, removeAttachment }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const [contextPickerActive, setContextPickerActive] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hashPositionRef = useRef<number>(-1);

    useEffect(() => {
        const handleMessage = (msg: VSCodeMessage) => {
            if (msg.command === 'contextPickerResult') {
                setContextPickerActive(false);
                
                if (msg.result && textareaRef.current) {
                    // Insert the reference into the input at the hash position
                    const textarea = textareaRef.current;
                    const currentValue = textarea.value;
                    const cursorPos = textarea.selectionStart;
                    
                    // Find the hash position
                    if (hashPositionRef.current >= 0) {
                        const beforeHash = currentValue.substring(0, hashPositionRef.current);
                        const afterCursor = currentValue.substring(cursorPos);
                        const reference = msg.result.reference || `#${msg.result.file || msg.result.name}`;
                        
                        const newValue = beforeHash + reference + ' ' + afterCursor;
                        setMessage(newValue);
                        
                        // Set cursor position after the inserted reference
                        setTimeout(() => {
                            const newCursorPos = hashPositionRef.current + reference.length + 1;
                            textarea.setSelectionRange(newCursorPos, newCursorPos);
                        }, 0);
                    }
                    
                    hashPositionRef.current = -1;
                }
            }
        };
        setupMessageListener(handleMessage);
    }, []);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message, attachments);
            setMessage('');
            // Don't clear attachments - they should persist for visibility
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !contextPickerActive) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Check if "#" was just typed
        if (value.length > 0 && cursorPos > 0 && value[cursorPos - 1] === '#') {
            // Store the hash position
            hashPositionRef.current = cursorPos - 1;
            
            // Extract query after "#" (if any)
            const textAfterHash = value.substring(cursorPos);
            const spaceIndex = textAfterHash.indexOf(' ');
            const query = spaceIndex > 0 ? textAfterHash.substring(0, spaceIndex) : '';
            
            // Trigger context picker
            setContextPickerActive(true);
            vscodeApi.postMessage({
                command: 'openContextPicker',
                query: query
            });
        } else if (contextPickerActive && value.length > 0) {
            // Update query as user types after "#"
            const hashIndex = value.lastIndexOf('#', cursorPos - 1);
            if (hashIndex >= 0) {
                const textAfterHash = value.substring(hashIndex + 1, cursorPos);
                const spaceIndex = textAfterHash.indexOf(' ');
                const query = spaceIndex > 0 ? textAfterHash.substring(0, spaceIndex) : textAfterHash;
                
                // Update context picker query
                vscodeApi.postMessage({
                    command: 'openContextPicker',
                    query: query
                });
            }
        } else {
            setContextPickerActive(false);
            hashPositionRef.current = -1;
        }
        
        setMessage(value);
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
            {/* Attachments display above input area */}
            {attachments.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
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
            <div className="flex gap-2 items-center flex-wrap">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (pickFiles) {
                            pickFiles();
                        }
                    }}
                    disabled={disabled}
                    className="sigil-attach-btn shrink-0 w-9 h-9 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors border"
                    title="Attach file"
                    aria-label="Attach file"
                >
                    <PaperclipIcon />
                </button>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={contextPickerActive ? "Type to search workspace files and symbols..." : placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 min-w-[140px] resize-none rounded-lg border px-3 py-2 focus:outline-none disabled:opacity-50 sigil-input"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                {contextPickerActive && (
                    <span className="text-xs sigil-muted px-2">Searching workspace...</span>
                )}
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
