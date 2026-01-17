/**
 * Socket.io Client Service
 * Manages WebSocket connection for real-time collaboration
 */

import { io, Socket } from 'socket.io-client';
import type { Annotation, ActiveUser } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Socket event types
export interface SocketEvents {
    // Connection events
    connect: () => void;
    disconnect: () => void;
    error: (data: { message: string }) => void;

    // Document room events
    'user-joined': (data: { user: ActiveUser; documentId: string }) => void;
    'user-left': (data: { userId: string; documentId: string }) => void;
    'active-users': (data: { users: ActiveUser[]; documentId: string }) => void;

    // Annotation events
    'annotation-created': (data: { annotation: Annotation }) => void;
    'annotation-updated': (data: { annotation: Annotation }) => void;
    'annotation-deleted': (data: { annotationId: string; documentId: string }) => void;
}

class SocketService {
    private socket: Socket | null = null;
    private currentDocumentId: string | null = null;

    /**
     * Connect to Socket.io server
     */
    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket?.id);

            // Rejoin document room if was in one
            if (this.currentDocumentId) {
                this.joinDocument(this.currentDocumentId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error);
        });

        return this.socket;
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentDocumentId = null;
        }
    }

    /**
     * Get the socket instance
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Join a document room
     */
    joinDocument(documentId: string): void {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot join document');
            return;
        }

        // Leave current document if any
        if (this.currentDocumentId && this.currentDocumentId !== documentId) {
            this.leaveDocument(this.currentDocumentId);
        }

        this.socket.emit('join-document', { documentId });
        this.currentDocumentId = documentId;
    }

    /**
     * Leave a document room
     */
    leaveDocument(documentId: string): void {
        if (!this.socket?.connected) return;

        this.socket.emit('leave-document', { documentId });

        if (this.currentDocumentId === documentId) {
            this.currentDocumentId = null;
        }
    }

    /**
     * Create annotation via socket
     */
    createAnnotation(annotation: {
        documentId: string;
        startOffset: number;
        endOffset: number;
        selectedText: string;
        comment: string;
    }): void {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot create annotation');
            return;
        }

        this.socket.emit('create-annotation', { annotation });
    }

    /**
     * Update annotation via socket
     */
    updateAnnotation(annotation: {
        _id: string;
        comment?: string;
        isResolved?: boolean;
    }): void {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot update annotation');
            return;
        }

        this.socket.emit('update-annotation', { annotation });
    }

    /**
     * Delete annotation via socket
     */
    deleteAnnotation(annotationId: string): void {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot delete annotation');
            return;
        }

        this.socket.emit('delete-annotation', { annotationId });
    }

    /**
     * Register event listener
     */
    on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
        if (!this.socket) {
            console.warn('Socket not initialized');
            return;
        }

        this.socket.on(event as string, callback as any);
    }

    /**
     * Remove event listener
     */
    off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event as string, callback as any);
        } else {
            this.socket.off(event as string);
        }
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
