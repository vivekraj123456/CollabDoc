/**
 * useAnnotations Hook
 * Manages annotation state with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Annotation, AnnotationCreate, ActiveUser } from '../types';
import { annotationsApi, socketService } from '../services';
import { useSocket } from '../contexts';

interface UseAnnotationsOptions {
    documentId: string | null;
}

interface UseAnnotationsReturn {
    annotations: Annotation[];
    activeUsers: ActiveUser[];
    isLoading: boolean;
    error: string | null;
    createAnnotation: (data: AnnotationCreate) => Promise<void>;
    updateAnnotation: (id: string, data: { comment?: string; isResolved?: boolean }) => Promise<void>;
    deleteAnnotation: (id: string) => Promise<void>;
    refreshAnnotations: () => Promise<void>;
}

export function useAnnotations({ documentId }: UseAnnotationsOptions): UseAnnotationsReturn {
    const { socket, joinDocument, leaveDocument } = useSocket();
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const prevDocumentId = useRef<string | null>(null);

    // Load annotations when document changes
    const loadAnnotations = useCallback(async () => {
        if (!documentId) {
            setAnnotations([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await annotationsApi.getByDocument(documentId);
            setAnnotations(response.annotations);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load annotations');
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    // Join/leave document room
    useEffect(() => {
        if (documentId && documentId !== prevDocumentId.current) {
            // Leave previous document
            if (prevDocumentId.current) {
                leaveDocument(prevDocumentId.current);
            }

            // Join new document
            joinDocument(documentId);
            loadAnnotations();

            prevDocumentId.current = documentId;
        }

        return () => {
            if (prevDocumentId.current) {
                leaveDocument(prevDocumentId.current);
                prevDocumentId.current = null;
            }
        };
    }, [documentId, joinDocument, leaveDocument, loadAnnotations]);

    // Set up socket event listeners
    useEffect(() => {
        if (!socket || !documentId) return;

        const handleAnnotationCreated = ({ annotation }: { annotation: Annotation }) => {
            setAnnotations((prev) => {
                // Check if already exists (might have been added optimistically)
                const exists = prev.some((a) => a._id === annotation._id);
                if (exists) {
                    return prev.map((a) => (a._id === annotation._id ? annotation : a));
                }
                // Add new annotation sorted by startOffset
                const newAnnotations = [...prev, annotation];
                return newAnnotations.sort((a, b) => a.startOffset - b.startOffset);
            });
        };

        const handleAnnotationUpdated = ({ annotation }: { annotation: Annotation }) => {
            setAnnotations((prev) =>
                prev.map((a) => (a._id === annotation._id ? annotation : a))
            );
        };

        const handleAnnotationDeleted = ({ annotationId }: { annotationId: string }) => {
            setAnnotations((prev) => prev.filter((a) => a._id !== annotationId));
        };

        const handleUserJoined = ({ user }: { user: ActiveUser }) => {
            setActiveUsers((prev) => {
                const exists = prev.some((u) => u.id === user.id);
                if (exists) return prev;
                return [...prev, user];
            });
        };

        const handleUserLeft = ({ userId }: { userId: string }) => {
            setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
        };

        const handleActiveUsers = ({ users }: { users: ActiveUser[] }) => {
            setActiveUsers(users);
        };

        socketService.on('annotation-created', handleAnnotationCreated);
        socketService.on('annotation-updated', handleAnnotationUpdated);
        socketService.on('annotation-deleted', handleAnnotationDeleted);
        socketService.on('user-joined', handleUserJoined);
        socketService.on('user-left', handleUserLeft);
        socketService.on('active-users', handleActiveUsers);

        return () => {
            socketService.off('annotation-created', handleAnnotationCreated);
            socketService.off('annotation-updated', handleAnnotationUpdated);
            socketService.off('annotation-deleted', handleAnnotationDeleted);
            socketService.off('user-joined', handleUserJoined);
            socketService.off('user-left', handleUserLeft);
            socketService.off('active-users', handleActiveUsers);
        };
    }, [socket, documentId]);

    const createAnnotation = useCallback(async (data: AnnotationCreate) => {
        if (!documentId) return;

        // Use socket for real-time sync
        socketService.createAnnotation({
            documentId,
            ...data,
        });
    }, [documentId]);

    const updateAnnotation = useCallback(async (
        id: string,
        data: { comment?: string; isResolved?: boolean }
    ) => {
        socketService.updateAnnotation({ _id: id, ...data });
    }, []);

    const deleteAnnotation = useCallback(async (id: string) => {
        socketService.deleteAnnotation(id);
    }, []);

    const refreshAnnotations = useCallback(async () => {
        await loadAnnotations();
    }, [loadAnnotations]);

    return {
        annotations,
        activeUsers,
        isLoading,
        error,
        createAnnotation,
        updateAnnotation,
        deleteAnnotation,
        refreshAnnotations,
    };
}

export default useAnnotations;
