import { useState, useEffect } from 'react';

interface FeedbackButtonProps {
    messageId: string;
    onFeedback: (messageId: string, rating: 'good' | 'bad', reason: string) => void;
    feedbackSubmitted?: boolean;
    feedbackRating?: 'good' | 'bad';
    isSubmitting?: boolean;
}

const GOOD_REASONS = ["Helpful", "Accurate", "Well Explained", "Other"];
const BAD_REASONS = ["Incorrect", "Not Helpful", "Confusing", "Other"];

export function FeedbackButton({ messageId, onFeedback, feedbackSubmitted = false, feedbackRating, isSubmitting = false }: FeedbackButtonProps) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [rating, setRating] = useState<'good' | 'bad' | null>(null);
    const [reason, setReason] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');
    const [localSubmitting, setLocalSubmitting] = useState(false);

    // Reset form when feedback is successfully submitted
    useEffect(() => {
        if (feedbackSubmitted) {
            console.log('Feedback confirmed submitted, resetting local state', { messageId, feedbackSubmitted, feedbackRating });
            setShowFeedback(false);
            setRating(null);
            setReason('');
            setCustomReason('');
            setLocalSubmitting(false);
        }
    }, [feedbackSubmitted, messageId, feedbackRating]);

    // Clear localSubmitting if confirmation arrived but local state wasn't updated yet
    useEffect(() => {
        if (feedbackSubmitted && localSubmitting) {
            console.log('Clearing localSubmitting because feedbackSubmitted is true');
            setLocalSubmitting(false);
        }
    }, [feedbackSubmitted, localSubmitting]);

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
            // Set local submitting state immediately
            setLocalSubmitting(true);
            setShowFeedback(false);
            setReason('');
            setCustomReason('');
            // Call onFeedback to trigger actual submission
            onFeedback(messageId, rating, reasonToSubmit);
        }
    };

    // Show confirmation state if feedback has been submitted
    // Check this BEFORE loading state to prioritize confirmation
    if (feedbackSubmitted && feedbackRating) {
        console.log('Showing feedback confirmation for messageId:', messageId, 'rating:', feedbackRating, 'localSubmitting:', localSubmitting, 'isSubmitting:', isSubmitting);
        return (
            <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 dark:text-green-400" style={{ color: 'var(--vscode-testing-iconPassed)' }}>
                    ✓
                </span>
                <span className="text-xs" style={{ color: 'var(--vscode-foreground)' }}>
                    Feedback recorded
                </span>
            </div>
        );
    }

    // Show loading state while submitting (check both local and prop state)
    // Only show loading if NOT already confirmed
    if (!feedbackSubmitted && (isSubmitting || localSubmitting)) {
        console.log('Showing loading state', { messageId, isSubmitting, localSubmitting, feedbackSubmitted, feedbackRating });
        return (
            <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: 'var(--vscode-foreground)' }}></div>
                <span className="text-xs" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Submitting feedback...
                </span>
            </div>
        );
    }

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
                            disabled={isSubmitting}
                            className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!customReason.trim() || isSubmitting}
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
                                disabled={isSubmitting}
                                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
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
                disabled={feedbackSubmitted || isSubmitting}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Good response"
            >
                👍 Good
            </button>
            <button
                onClick={() => handleRatingClick('bad')}
                disabled={feedbackSubmitted || isSubmitting}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Bad response"
            >
                👎 Bad
            </button>
        </div>
    );
}
