import { FileContext as FileContextType } from '../hooks/useChat';

interface FileContextProps {
    fileContext: FileContextType | null;
    onRequestContext: () => void;
}

export function FileContext({ fileContext, onRequestContext }: FileContextProps) {
    if (!fileContext) {
        return (
            <div className="border-b border-gray-200 dark:border-gray-700 p-2">
                <button
                    onClick={onRequestContext}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Detect current file
                </button>
            </div>
        );
    }

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {fileContext.isSelection ? 'Selection' : 'File'}: {fileContext.fileName}
                </span>
                <button
                    onClick={onRequestContext}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Refresh
                </button>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
                Contents are not shown. Use the toggle below the input to include file contents in your next message.
            </div>
        </div>
    );
}
