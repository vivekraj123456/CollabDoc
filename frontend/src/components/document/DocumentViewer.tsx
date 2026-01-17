/**
 * Document Viewer Component
 * Displays document content with highlighted annotations
 */

import React, { useRef, useMemo, useCallback } from 'react';
import type { Annotation, TextSelection } from '../../types';
import { useTextSelection } from '../../hooks';
import './DocumentViewer.css';

interface DocumentViewerProps {
    content: string;
    annotations: Annotation[];
    selectedAnnotationId: string | null;
    onSelection: (selection: TextSelection | null) => void;
    onAnnotationClick: (annotation: Annotation) => void;
}

interface TextSegment {
    text: string;
    annotations: Annotation[];
    startOffset: number;
    endOffset: number;
}

export function DocumentViewer({
    content,
    annotations,
    selectedAnnotationId,
    onSelection,
    onAnnotationClick,
}: DocumentViewerProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useTextSelection({
        containerRef: contentRef,
        onSelect: onSelection,
        enabled: true,
    });

    /**
     * Create text segments with overlapping annotations
     * This is where the magic happens for handling 1000+ annotations efficiently
     */
    const segments = useMemo((): TextSegment[] => {
        if (!content || annotations.length === 0) {
            return [{ text: content, annotations: [], startOffset: 0, endOffset: content.length }];
        }

        // Create a list of all boundaries (start and end points)
        const boundaries = new Set<number>();
        boundaries.add(0);
        boundaries.add(content.length);

        annotations.forEach((a) => {
            boundaries.add(Math.max(0, a.startOffset));
            boundaries.add(Math.min(content.length, a.endOffset));
        });

        // Sort boundaries
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

        // Create segments between boundaries
        const result: TextSegment[] = [];

        for (let i = 0; i < sortedBoundaries.length - 1; i++) {
            const start = sortedBoundaries[i];
            const end = sortedBoundaries[i + 1];

            // Find all annotations that cover this segment
            const coveringAnnotations = annotations.filter(
                (a) => a.startOffset <= start && a.endOffset >= end
            );

            result.push({
                text: content.slice(start, end),
                annotations: coveringAnnotations,
                startOffset: start,
                endOffset: end,
            });
        }

        return result;
    }, [content, annotations]);

    const handleSegmentClick = useCallback(
        (segment: TextSegment, e: React.MouseEvent) => {
            if (segment.annotations.length > 0) {
                e.stopPropagation();
                // Click the first (or most recent) annotation
                const sortedAnns = [...segment.annotations].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                onAnnotationClick(sortedAnns[0]);
            }
        },
        [onAnnotationClick]
    );

    const getSegmentStyle = useCallback(
        (segment: TextSegment): React.CSSProperties => {
            if (segment.annotations.length === 0) {
                return {};
            }

            const isSelected = segment.annotations.some(
                (a) => a._id === selectedAnnotationId
            );

            // Use the color of the first annotation, with opacity based on overlap count
            const primaryAnnotation = segment.annotations[0];
            const overlapCount = segment.annotations.length;

            // Increase opacity for more overlaps
            const baseOpacity = 0.25;
            const opacity = Math.min(baseOpacity + (overlapCount - 1) * 0.1, 0.6);

            return {
                backgroundColor: `${primaryAnnotation.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                borderBottom: isSelected ? `2px solid ${primaryAnnotation.color}` : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
            };
        },
        [selectedAnnotationId]
    );

    return (
        <div className="document-viewer">
            <div ref={contentRef} className="document-content">
                {segments.map((segment, index) => (
                    <span
                        key={`${segment.startOffset}-${index}`}
                        className={`text-segment ${segment.annotations.length > 0 ? 'has-annotation' : ''
                            } ${segment.annotations.some((a) => a._id === selectedAnnotationId)
                                ? 'selected'
                                : ''
                            }`}
                        style={getSegmentStyle(segment)}
                        onClick={(e) => handleSegmentClick(segment, e)}
                        data-annotation-count={segment.annotations.length}
                    >
                        {segment.text}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default DocumentViewer;
