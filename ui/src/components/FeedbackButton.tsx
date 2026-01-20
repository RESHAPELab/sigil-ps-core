import { useState } from 'react';

interface FeedbackButtonProps {
    messageId: string;
    onFeedback: (messageId: string, rating: 'good' | 'bad', reason: string) => void;
}

const GOOD_REASONS = ["Helpful", "Accurate", "Well Explained", "Other"];
const BAD_REASONS = ["Incorrect", "Not Helpful", "Confusing", "Other"];

export function FeedbackButton({ messageId, onFeedback }: FeedbackButtonProps) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [rating, setRating] = useState<'good' | 'bad' | null>(null);
    const [reason, setReason] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');

    const handleRatingClick = (selectedRating: 'good' | 'bad') => {
        setRating(selectedRating);
        setShowFeedback(true);
    };

    const handleReasonSelect = (selectedReason: string) => {
        if (selectedReason === 'Other') {
            setReason('Other');
        } else {
            setReason(selectedReason);
            handleSubmit(selectedReason);
        }
    };

    const handleSubmit = (finalReason?: string) => {
        const reasonToSubmit = finalReason || (reason === 'Other' ? customReason : reason);
        if (reasonToSubmit && rating) {
            onFeedback(messageId, rating, reasonToSubmit);
            setShowFeedback(false);
            setRating(null);
            setReason('');
            setCustomReason('');
        }
    };

    if (showFeedback) {
        const reasons = rating === 'good' ? GOOD_REASONS : BAD_REASONS;
        
        return (
            <div className="mt-2 space-y-2">
                <p className="text-sm font-medium">Why was this response {rating}?</p>
                <div className="flex flex-wrap gap-2">
                    {reasons.map((r) => (
                        <button
                            key={r}
                            onClick={() => handleReasonSelect(r)}
                            className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {r}
                        </button>
                    ))}
                </div>
                {reason === 'Other' && (
                    <div className="space-y-2">
                        <textarea
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Please provide additional details"
                            className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!customReason.trim()}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Submit
                            </button>
                            <button
                                onClick={() => {
                                    setShowFeedback(false);
                                    setRating(null);
                                    setReason('');
                                    setCustomReason('');
                                }}
                                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-2 mt-2">
            <button
                onClick={() => handleRatingClick('good')}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Good response"
            >
                👍 Good
            </button>
            <button
                onClick={() => handleRatingClick('bad')}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Bad response"
            >
                👎 Bad
            </button>
        </div>
    );
}
