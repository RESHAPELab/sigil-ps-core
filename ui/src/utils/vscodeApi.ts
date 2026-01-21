// VS Code Webview API wrapper
declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};

const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

export interface VSCodeMessage {
    command: string;
    [key: string]: any;
}

export const vscodeApi = {
    postMessage: (message: VSCodeMessage) => {
        if (vscode) {
            vscode.postMessage(message);
        } else {
            console.warn('VS Code API not available', message);
        }
    },
    
    getState: () => {
        return vscode?.getState() || null;
    },
    
    setState: (state: any) => {
        if (vscode) {
            vscode.setState(state);
        }
    }
};

// Message listener setup
export function setupMessageListener(callback: (message: VSCodeMessage) => void) {
    if (typeof window !== 'undefined') {
        window.addEventListener('message', (event) => {
            callback(event.data);
        });
    }
}
