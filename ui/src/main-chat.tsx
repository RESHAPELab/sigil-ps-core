import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatApp } from './ChatApp';
import './index.css';
import './vscode-theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChatApp />
    </React.StrictMode>
);
