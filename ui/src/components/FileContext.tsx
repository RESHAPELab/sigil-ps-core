import { FileContext as FileContextType } from '../hooks/useChat';

interface FileContextProps {
    fileContext: FileContextType | null;
}

export function FileContext({ fileContext }: FileContextProps) {
    if (!fileContext) {
        return null;
    }

    const label = fileContext.isSelection ? 'Selection' : 'File';

    return (
        <div className="flex items-center gap-2 text-xs px-2 py-1 sigil-border rounded">
            <span className="font-medium sigil-muted">{label}:</span>
            <span className="font-semibold">{fileContext.fileName}</span>
            {fileContext.isSelection && (
                <span className="px-2 py-0.5 text-[11px] rounded-full sigil-border">
                    selection
                </span>
            )}
        </div>
    );
}
