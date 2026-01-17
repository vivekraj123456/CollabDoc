/**
 * Annotation Card Component
 * Displays a single annotation in the sidebar
 */

import React, { useState } from 'react';
import type { Annotation } from '../../types';
import { useAuth } from '../../contexts';
import './AnnotationCard.css';

interface AnnotationCardProps {
    annotation: Annotation;
    isSelected: boolean;
    onClick: () => void;
    onUpdate: (data: { comment?: string; isResolved?: boolean }) => void;
    onDelete: () => void;
}

export function AnnotationCard({
    annotation,
    isSelected,
    onClick,
    onUpdate,
    onDelete,
}: AnnotationCardProps) {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editComment, setEditComment] = useState(annotation.comment);

    const isOwner = user?._id === annotation.userId;
    const displayUser = annotation.user || { displayName: 'Unknown', color: '#888' };

    const handleSave = () => {
        if (editComment.trim() && editComment !== annotation.comment) {
            onUpdate({ comment: editComment.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditComment(annotation.comment);
        }
    };

    const toggleResolved = () => {
        onUpdate({ isResolved: !annotation.isResolved });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={`annotation-card ${isSelected ? 'selected' : ''} ${annotation.isResolved ? 'resolved' : ''
                }`}
            onClick={onClick}
            style={{ borderLeftColor: displayUser.color }}
        >
            <div className="annotation-header">
                <div className="annotation-user">
                    <span
                        className="annotation-avatar"
                        style={{ backgroundColor: displayUser.color }}
                    >
                        {displayUser.displayName?.charAt(0).toUpperCase()}
                    </span>
                    <span className="annotation-username">{displayUser.displayName}</span>
                </div>
                <span className="annotation-time">{formatDate(annotation.createdAt)}</span>
            </div>

            <div className="annotation-selected-text">
                "{annotation.selectedText.length > 100
                    ? annotation.selectedText.slice(0, 100) + '...'
                    : annotation.selectedText}"
            </div>

            {isEditing ? (
                <div className="annotation-edit">
                    <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="form-input"
                        rows={3}
                        autoFocus
                    />
                    <div className="annotation-edit-actions">
                        <button className="btn btn-sm btn-primary" onClick={handleSave}>
                            Save
                        </button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => {
                                setIsEditing(false);
                                setEditComment(annotation.comment);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="annotation-comment">{annotation.comment}</p>
            )}

            <div className="annotation-actions">
                <button
                    className={`btn btn-sm btn-ghost ${annotation.isResolved ? 'resolved' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleResolved();
                    }}
                    title={annotation.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                >
                    {annotation.isResolved ? '↩ Reopen' : '✓ Resolve'}
                </button>

                {isOwner && (
                    <>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                        >
                            Edit
                        </button>
                        <button
                            className="btn btn-sm btn-ghost btn-danger-text"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this annotation?')) {
                                    onDelete();
                                }
                            }}
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default AnnotationCard;
