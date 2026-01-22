import { useState, useEffect, useCallback, useRef } from 'react';
import { vscodeApi, setupMessageListener, VSCodeMessage } from '../utils/vscodeApi';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    conversationId?: string;
    attachments?: Attachment[];
}

export interface FileContext {
    fileName: string;
    content: string;
    isSelection: boolean;
}

export interface Attachment {
    fileName: string;
    content: string;
}

export interface AuthState {
    authenticated: boolean;
    user?: {
        login: string;
        name: string;
    };
}

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [authState, setAuthState] = useState<AuthState>({ authenticated: false });
    const [fileContext, setFileContext] = useState<FileContext | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feedbackState, setFeedbackState] = useState<Map<string, { rating: 'good' | 'bad', submitted: boolean }>>(new Map());
    const [pendingFeedback, setPendingFeedback] = useState<Map<string, 'good' | 'bad'>>(new Map());
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    // Use a ref so the webview message listener (registered once) can read the latest pending feedback.
    const pendingFeedbackRef = useRef<Map<string, 'good' | 'bad'>>(new Map());

    useEffect(() => {
        // Request authentication status on mount
        vscodeApi.postMessage({ command: 'requestAuth' });
        
        // Request file context
        vscodeApi.postMessage({ command: 'getFileContext' });

        // Set up message listener
        const handleMessage = (message: VSCodeMessage) => {
            switch (message.command) {
                case 'authStatus':
                    setAuthState({
                        authenticated: message.authenticated,
                        user: message.user
                    });
                    break;
                
                case 'messageAdded':
                    setMessages(prev => [...prev, message.message]);
                    setError(null);
                    break;
                
                case 'loading':
                    setLoading(message.loading);
                    break;
                
                case 'fileContext':
                    setFileContext(message.context);
                    break;
                
                case 'error':
                    setError(message.error);
                    setLoading(false);
                    break;
                
                case 'initialized':
                    if (message.data?.conversationHistory) {
                        setMessages(message.data.conversationHistory);
                    }
                    break;
                
                case 'historyCleared':
                    setMessages([]);
                    setFeedbackState(new Map());
                    setPendingFeedback(new Map());
                    pendingFeedbackRef.current = new Map();
                    break;
                
                case 'feedbackSubmitted':
                    if (message.messageId) {
                        if (message.success) {
                            const rating = pendingFeedbackRef.current.get(message.messageId);
                            if (rating) {
                                setFeedbackState(prev => {
                                    const newState = new Map(prev);
                                    newState.set(message.messageId, { rating, submitted: true });
                                    return newState;
                                });
                            }
                        }
                        // Clear pending feedback regardless of success/failure
                        pendingFeedbackRef.current.delete(message.messageId);
                        setPendingFeedback(prev => {
                            const newState = new Map(prev);
                            newState.delete(message.messageId);
                            return newState;
                        });
                    }
                    break;
                
                case 'filesPicked':
                    if (message.files && Array.isArray(message.files)) {
                        setAttachments(prev => {
                            // Add new files, avoiding duplicates by fileName
                            const existingNames = new Set(prev.map(a => a.fileName));
                            const newFiles = message.files.filter((f: Attachment) => !existingNames.has(f.fileName));
                            return [...prev, ...newFiles];
                        });
                    }
                    break;
                
                case 'contextPickerResult':
                    if (message.result) {
                        // Add context to attachments
                        if (message.result.type === 'file') {
                            setAttachments(prev => {
                                const existingNames = new Set(prev.map(a => a.fileName));
                                if (!existingNames.has(message.result.file)) {
                                    return [...prev, {
                                        fileName: message.result.file,
                                        content: message.result.content
                                    }];
                                }
                                return prev;
                            });
                        } else if (message.result.type === 'symbol') {
                            // For symbols, add as a file reference with context
                            setAttachments(prev => {
                                const fileName = `${message.result.file}:${message.result.line}`;
                                const existingNames = new Set(prev.map(a => a.fileName));
                                if (!existingNames.has(fileName)) {
                                    return [...prev, {
                                        fileName: fileName,
                                        content: `Symbol: ${message.result.name}\nFile: ${message.result.file}\nLine: ${message.result.line}\n\nContext:\n${message.result.context}`
                                    }];
                                }
                                return prev;
                            });
                        }
                        // Notify that context was added (for UI feedback)
                        vscodeApi.postMessage({
                            command: 'contextAdded',
                            reference: message.result.reference
                        });
                    }
                    break;
            }
        };

        setupMessageListener(handleMessage);

        // Notify VS Code that webview is ready
        vscodeApi.postMessage({ command: 'ready' });
    }, []);

    const sendMessage = useCallback((message: string, _includeFileContext: boolean = true, attachmentsToSend: Attachment[] = []) => {
        if (!message.trim()) return;
        
        setError(null);
        vscodeApi.postMessage({
            command: 'sendMessage',
            data: {
                message: message.trim(),
                includeFileContext: true,
                attachments: attachmentsToSend
            }
        });
        // Don't clear attachments - they should persist for visibility
    }, []);

    const pickFiles = useCallback(() => {
        vscodeApi.postMessage({ command: 'pickFiles' });
    }, []);

    const removeAttachment = useCallback((fileName: string) => {
        setAttachments(prev => prev.filter(a => a.fileName !== fileName));
    }, []);

    const requestFileContext = useCallback(() => {
        vscodeApi.postMessage({ command: 'getFileContext' });
    }, []);

    const submitFeedback = useCallback((messageId: string, rating: 'good' | 'bad', reason: string) => {
        // Update ref immediately (no stale-closure issues in the message listener).
        pendingFeedbackRef.current.set(messageId, rating);
        // Mark feedback as pending
        setPendingFeedback(prev => {
            const newState = new Map(prev);
            newState.set(messageId, rating);
            return newState;
        });
        
        vscodeApi.postMessage({
            command: 'submitFeedback',
            data: {
                messageId,
                rating,
                reason
            }
        });
    }, []);


    const requestAuth = useCallback(() => {
        vscodeApi.postMessage({ command: 'requestAuth' });
    }, []);

    const getFeedbackStatus = useCallback((messageId: string) => {
        return feedbackState.get(messageId) || null;
    }, [feedbackState]);

    const getPendingFeedback = useCallback((messageId: string) => {
        return pendingFeedback.has(messageId);
    }, [pendingFeedback]);

    return {
        messages,
        loading,
        authState,
        fileContext,
        error,
        sendMessage,
        requestFileContext,
        submitFeedback,
        requestAuth,
        getFeedbackStatus,
        getPendingFeedback,
        attachments,
        pickFiles,
        removeAttachment
    };
}
