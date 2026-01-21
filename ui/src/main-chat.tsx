import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatApp } from './ChatApp';
import './index.css';
import './vscode-theme.css';

// VS Code webviews disallow service workers. Ensure any attempted registration is a no-op.
if (typeof navigator !== 'undefined' && (navigator as any).serviceWorker) {
    try {
        // Best-effort: unregister existing workers in this scope
        (navigator as any).serviceWorker.getRegistrations?.().then((regs: any[]) => {
            regs?.forEach((r) => r.unregister());
        });
        // Override register to a resolved no-op to prevent InvalidStateError
        (navigator as any).serviceWorker.register = () => Promise.resolve(null);
    } catch {
        // ignore
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChatApp />
    </React.StrictMode>
);
