import { useState, useEffect, useCallback } from 'react';
import { vscodeApi, setupMessageListener, VSCodeMessage } from '../utils/vscodeApi';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    conversationId?: string;
}

export interface FileContext {
    fileName: string;
    content: string;
    isSelection: boolean;
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
                    break;
            }
        };

        setupMessageListener(handleMessage);

        // Notify VS Code that webview is ready
        vscodeApi.postMessage({ command: 'ready' });
    }, []);

    const sendMessage = useCallback((message: string, includeFileContext: boolean = false) => {
        if (!message.trim()) return;
        
        setError(null);
        vscodeApi.postMessage({
            command: 'sendMessage',
            data: {
                message: message.trim(),
                includeFileContext
            }
        });
    }, []);

    const requestFileContext = useCallback(() => {
        vscodeApi.postMessage({ command: 'getFileContext' });
    }, []);

    const submitFeedback = useCallback((messageId: string, rating: 'good' | 'bad', reason: string) => {
        vscodeApi.postMessage({
            command: 'submitFeedback',
            data: {
                messageId,
                rating,
                reason
            }
        });
    }, []);

    const clearHistory = useCallback(() => {
        vscodeApi.postMessage({ command: 'clearHistory' });
    }, []);

    const requestAuth = useCallback(() => {
        vscodeApi.postMessage({ command: 'requestAuth' });
    }, []);

    return {
        messages,
        loading,
        authState,
        fileContext,
        error,
        sendMessage,
        requestFileContext,
        submitFeedback,
        clearHistory,
        requestAuth
    };
}
