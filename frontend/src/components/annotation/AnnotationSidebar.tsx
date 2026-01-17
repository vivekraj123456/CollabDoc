/**
 * Annotation Sidebar Component
 * Displays list of annotations and annotation form
 */

import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Annotation, TextSelection, ActiveUser } from '../../types';
import { AnnotationCard } from './AnnotationCard';
import { AnnotationForm } from './AnnotationForm';
import './AnnotationSidebar.css';

interface AnnotationSidebarProps {
    annotations: Annotation[];
    activeUsers: ActiveUser[];
    selectedAnnotationId: string | null;
    currentSelection: TextSelection | null;
    onAnnotationClick: (annotation: Annotation) => void;
    onAnnotationCreate: (comment: string) => void;
    onAnnotationUpdate: (id: string, data: { comment?: string; isResolved?: boolean }) => void;
    onAnnotationDelete: (id: string) => void;
    onClearSelection: () => void;
}

type FilterType = 'all' | 'active' | 'resolved';

export function AnnotationSidebar({
    annotations,
    activeUsers,
    selectedAnnotationId,
    currentSelection,
    onAnnotationClick,
    onAnnotationCreate,
    onAnnotationUpdate,
    onAnnotationDelete,
    onClearSelection,
}: AnnotationSidebarProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and search annotations
    const filteredAnnotations = useMemo(() => {
        return annotations.filter((annotation) => {
            // Apply filter
            if (filter === 'active' && annotation.isResolved) return false;
            if (filter === 'resolved' && !annotation.isResolved) return false;

            // Apply search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    annotation.comment.toLowerCase().includes(query) ||
                    annotation.selectedText.toLowerCase().includes(query) ||
                    annotation.user?.displayName?.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [annotations, filter, searchQuery]);

    // Count stats
    const stats = useMemo(() => ({
        total: annotations.length,
        active: annotations.filter((a) => !a.isResolved).length,
        resolved: annotations.filter((a) => a.isResolved).length,
    }), [annotations]);

    // Row renderer for virtualized list
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const annotation = filteredAnnotations[index];
        return (
            <div style={{ ...style, paddingRight: '8px' }}>
                <AnnotationCard
                    annotation={annotation}
                    isSelected={selectedAnnotationId === annotation._id}
                    onClick={() => onAnnotationClick(annotation)}
                    onUpdate={(data) => onAnnotationUpdate(annotation._id, data)}
                    onDelete={() => onAnnotationDelete(annotation._id)}
                />
            </div>
        );
    };

    return (
        <aside className="annotation-sidebar">
            {/* Active Users */}
            {activeUsers.length > 0 && (
                <div className="active-users">
                    <span className="active-users-label">Active:</span>
                    <div className="active-users-list">
                        {activeUsers.map((user) => (
                            <span
                                key={user.id}
                                className="active-user-avatar"
                                style={{ backgroundColor: user.color }}
                                title={user.displayName}
                            >
                                {user.displayName.charAt(0).toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Annotation Form */}
            {currentSelection && (
                <AnnotationForm
                    selection={currentSelection}
                    onSubmit={onAnnotationCreate}
                    onCancel={onClearSelection}
                />
            )}

            {/* Stats and Filters */}
            <div className="sidebar-controls">
                <div className="annotation-stats">
                    <span className="stat">{stats.total} annotations</span>
                    <span className="stat-divider">•</span>
                    <span className="stat active">{stats.active} active</span>
                    <span className="stat-divider">•</span>
                    <span className="stat resolved">{stats.resolved} resolved</span>
                </div>

                <div className="sidebar-filters">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
                            onClick={() => setFilter('active')}
                        >
                            Active
                        </button>
                        <button
                            className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
                            onClick={() => setFilter('resolved')}
                        >
                            Resolved
                        </button>
                    </div>

                    <input
                        type="text"
                        className="form-input search-input"
                        placeholder="Search annotations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Annotations List with Virtualization */}
            <div className="annotations-list">
                {filteredAnnotations.length === 0 ? (
                    <div className="no-annotations">
                        {annotations.length === 0
                            ? 'No annotations yet. Select text to add one!'
                            : 'No annotations match your filters.'}
                    </div>
                ) : (
                    <List
                        height={500}
                        width="100%"
                        itemCount={filteredAnnotations.length}
                        itemSize={180}
                        className="virtualized-list"
                    >
                        {Row}
                    </List>
                )}
            </div>
        </aside>
    );
}

export default AnnotationSidebar;
