/**
 * useTextSelection Hook
 * Handles text selection for annotation creation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TextSelection } from '../types';

interface UseTextSelectionOptions {
    containerRef: React.RefObject<HTMLElement>;
    onSelect?: (selection: TextSelection) => void;
    enabled?: boolean;
}

export function useTextSelection({
    containerRef,
    onSelect,
    enabled = true,
}: UseTextSelectionOptions) {
    const [selection, setSelection] = useState<TextSelection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getTextOffset = useCallback((node: Node, offset: number): number => {
        const container = containerRef.current;
        if (!container) return 0;

        try {
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                null
            );

            let currentOffset = 0;
            let currentNode = walker.nextNode();

            while (currentNode) {
                if (currentNode === node) {
                    return currentOffset + offset;
                }
                currentOffset += currentNode.textContent?.length || 0;
                currentNode = walker.nextNode();
            }

            // If exact node not found, try to find it in the parent chain
            let parentNode = node.parentNode;
            while (parentNode && parentNode !== container) {
                const parentWalker = document.createTreeWalker(
                    container,
                    NodeFilter.SHOW_TEXT,
                    null
                );

                let pCurrentOffset = 0;
                let pCurrentNode = parentWalker.nextNode();

                while (pCurrentNode) {
                    if (pCurrentNode.parentNode === parentNode) {
                        return pCurrentOffset + offset;
                    }
                    pCurrentOffset += pCurrentNode.textContent?.length || 0;
                    pCurrentNode = parentWalker.nextNode();
                }

                parentNode = parentNode.parentNode;
            }

            return currentOffset + offset;
        } catch (error) {
            console.warn('Error calculating text offset:', error);
            return 0;
        }
    }, [containerRef]);

    const handleSelectionChange = useCallback(() => {
        if (!enabled || !containerRef.current) return;

        // Clear previous timeout
        if (selectionTimeoutRef.current) {
            clearTimeout(selectionTimeoutRef.current);
        }

        // Debounce selection handling
        selectionTimeoutRef.current = setTimeout(() => {
            const windowSelection = window.getSelection();

            if (!windowSelection || windowSelection.isCollapsed) {
                setSelection(null);
                setIsSelecting(false);
                return;
            }

            const selectedText = windowSelection.toString().trim();

            if (!selectedText) {
                setSelection(null);
                setIsSelecting(false);
                return;
            }

            // Check if selection is within our container
            const range = windowSelection.getRangeAt(0);
            const container = containerRef.current;
            
            // Check if either the start or end container is within our element
            const isWithinContainer = 
                container.contains(range.startContainer) || 
                container.contains(range.endContainer) ||
                container.contains(range.commonAncestorContainer);
            
            if (!isWithinContainer) {
                setSelection(null);
                setIsSelecting(false);
                return;
            }

            // Calculate offsets
            const startOffset = getTextOffset(range.startContainer, range.startOffset);
            const endOffset = getTextOffset(range.endContainer, range.endOffset);

            const newSelection: TextSelection = {
                startOffset,
                endOffset,
                selectedText,
            };

            setSelection(newSelection);
            setIsSelecting(true);
            onSelect?.(newSelection);
        }, 100);
    }, [enabled, containerRef, getTextOffset, onSelect]);

    const clearSelection = useCallback(() => {
        window.getSelection()?.removeAllRanges();
        setSelection(null);
        setIsSelecting(false);
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
        };
    }, [handleSelectionChange]);

    return {
        selection,
        isSelecting,
        clearSelection,
    };
}

export default useTextSelection;
