/**
 * Annotation Form Component
 * Form for creating new annotations
 */

import React, { useState } from 'react';
import type { TextSelection } from '../../types';
import './AnnotationForm.css';

interface AnnotationFormProps {
    selection: TextSelection;
    onSubmit: (comment: string) => void;
    onCancel: () => void;
}

export function AnnotationForm({ selection, onSubmit, onCancel }: AnnotationFormProps) {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(comment.trim());
            setComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit(e);
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="annotation-form-container">
            <div className="annotation-form-header">
                <h4>Add Annotation</h4>
                <button className="btn btn-ghost btn-sm" onClick={onCancel}>
                    ✕
                </button>
            </div>

            <div className="annotation-form-selection">
                "{selection.selectedText.length > 80
                    ? selection.selectedText.slice(0, 80) + '...'
                    : selection.selectedText}"
            </div>

            <form onSubmit={handleSubmit} className="annotation-form">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add your comment..."
                    className="form-input"
                    rows={3}
                    autoFocus
                    disabled={isSubmitting}
                />

                <div className="annotation-form-actions">
                    <span className="annotation-form-hint">Ctrl+Enter to submit</span>
                    <div className="annotation-form-buttons">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!comment.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Annotation'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AnnotationForm;
