/**
 * Socket.io Event Handler
 * Manages real-time collaboration for document annotations
 */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Annotation, DocumentModel } from '../models';
import config from '../config';

interface ISocketUser {
    id: string;
    username: string;
    displayName: string;
    color: string;
    socketId: string;
}

// Track active users per document
const documentUsers: Map<string, Map<string, ISocketUser>> = new Map();

/**
 * Authenticate socket connection using JWT
 */
async function authenticateSocket(socket: Socket): Promise<ISocketUser | null> {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token as string, config.jwtSecret) as {
            userId: string;
        };

        const user = await User.findById(decoded.userId);

        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            username: user.username,
            displayName: user.displayName,
            color: user.color,
            socketId: socket.id,
        };
    } catch {
        return null;
    }
}

/**
 * Check if user has access to document
 */
async function hasDocumentAccess(
    userId: string,
    documentId: string
): Promise<boolean> {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
        return false;
    }

    return (
        document.owner.toString() === userId ||
        document.collaborators.some((c) => c.toString() === userId)
    );
}

/**
 * Get active users in a document room
 */
function getActiveUsers(documentId: string): ISocketUser[] {
    const users = documentUsers.get(documentId);
    return users ? Array.from(users.values()) : [];
}

/**
 * Initialize Socket.io handlers
 */
export function initializeSocket(io: Server): void {
    io.on('connection', async (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Authenticate the socket
        const user = await authenticateSocket(socket);

        if (!user) {
            console.log(`❌ Socket authentication failed: ${socket.id}`);
            socket.emit('error', { message: 'Authentication required' });
            socket.disconnect();
            return;
        }

        console.log(`✅ User authenticated: ${user.displayName} (${socket.id})`);

        // Store user info on socket
        (socket as any).user = user;

        /**
         * Join a document room for real-time updates
         */
        socket.on('join-document', async (data: { documentId: string }) => {
            try {
                const { documentId } = data;

                // Verify access
                const hasAccess = await hasDocumentAccess(user.id, documentId);

                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied to document' });
                    return;
                }

                // Leave any previous document rooms
                const currentRooms = Array.from(socket.rooms).filter(
                    (room) => room !== socket.id && room.startsWith('doc:')
                );

                for (const room of currentRooms) {
                    socket.leave(room);
                    const docId = room.replace('doc:', '');

                    // Remove user from document users
                    const users = documentUsers.get(docId);
                    if (users) {
                        users.delete(user.id);
                        if (users.size === 0) {
                            documentUsers.delete(docId);
                        } else {
                            // Notify others that user left
                            socket.to(room).emit('user-left', {
                                userId: user.id,
                                documentId: docId,
                            });
                        }
                    }
                }

                // Join new document room
                const roomName = `doc:${documentId}`;
                socket.join(roomName);

                // Add user to document users
                if (!documentUsers.has(documentId)) {
                    documentUsers.set(documentId, new Map());
                }
                documentUsers.get(documentId)!.set(user.id, user);

                // Notify others that user joined
                socket.to(roomName).emit('user-joined', {
                    user: {
                        id: user.id,
                        username: user.username,
                        displayName: user.displayName,
                        color: user.color,
                    },
                    documentId,
                });

                // Send current active users to the joining user
                socket.emit('active-users', {
                    users: getActiveUsers(documentId),
                    documentId,
                });

                console.log(`📄 User ${user.displayName} joined document ${documentId}`);
            } catch (error) {
                console.error('Error joining document:', error);
                socket.emit('error', { message: 'Failed to join document' });
            }
        });

        /**
         * Leave a document room
         */
        socket.on('leave-document', (data: { documentId: string }) => {
            const { documentId } = data;
            const roomName = `doc:${documentId}`;

            socket.leave(roomName);

            // Remove user from document users
            const users = documentUsers.get(documentId);
            if (users) {
                users.delete(user.id);
                if (users.size === 0) {
                    documentUsers.delete(documentId);
                } else {
                    // Notify others
                    socket.to(roomName).emit('user-left', {
                        userId: user.id,
                        documentId,
                    });
                }
            }

            console.log(`📄 User ${user.displayName} left document ${documentId}`);
        });

        /**
         * Create annotation (real-time broadcast)
         */
        socket.on('create-annotation', async (data: { annotation: any }) => {
            try {
                const { annotation } = data;
                const documentId = annotation.documentId;

                // Verify access
                const hasAccess = await hasDocumentAccess(user.id, documentId);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Check for duplicate
                const existing = await Annotation.findOne({
                    documentId,
                    userId: user.id,
                    startOffset: annotation.startOffset,
                    endOffset: annotation.endOffset,
                });

                if (existing) {
                    socket.emit('error', { message: 'Duplicate annotation' });
                    return;
                }

                // Create annotation
                const newAnnotation = await Annotation.create({
                    documentId,
                    userId: user.id,
                    startOffset: annotation.startOffset,
                    endOffset: annotation.endOffset,
                    selectedText: annotation.selectedText,
                    comment: annotation.comment,
                    color: user.color,
                });

                await newAnnotation.populate('userId', 'username displayName color');

                const response = {
                    ...newAnnotation.toObject(),
                    user: newAnnotation.userId,
                    userId: user.id,
                };

                // Broadcast to all users in the document room (including sender)
                io.to(`doc:${documentId}`).emit('annotation-created', {
                    annotation: response,
                });

                console.log(`📝 Annotation created in document ${documentId}`);
            } catch (error) {
                console.error('Error creating annotation:', error);
                socket.emit('error', { message: 'Failed to create annotation' });
            }
        });

        /**
         * Update annotation (real-time broadcast)
         */
        socket.on('update-annotation', async (data: { annotation: any }) => {
            try {
                const { annotation } = data;

                const existingAnnotation = await Annotation.findById(annotation._id);

                if (!existingAnnotation) {
                    socket.emit('error', { message: 'Annotation not found' });
                    return;
                }

                // Only creator can update
                if (existingAnnotation.userId.toString() !== user.id) {
                    socket.emit('error', { message: 'Cannot update others annotations' });
                    return;
                }

                // Update
                if (annotation.comment !== undefined) {
                    existingAnnotation.comment = annotation.comment;
                }
                if (annotation.isResolved !== undefined) {
                    existingAnnotation.isResolved = annotation.isResolved;
                }

                await existingAnnotation.save();
                await existingAnnotation.populate('userId', 'username displayName color');

                const response = {
                    ...existingAnnotation.toObject(),
                    user: existingAnnotation.userId,
                    userId: user.id,
                };

                const documentId = existingAnnotation.documentId.toString();

                // Broadcast to all users in the document room
                io.to(`doc:${documentId}`).emit('annotation-updated', {
                    annotation: response,
                });

                console.log(`📝 Annotation updated in document ${documentId}`);
            } catch (error) {
                console.error('Error updating annotation:', error);
                socket.emit('error', { message: 'Failed to update annotation' });
            }
        });

        /**
         * Delete annotation (real-time broadcast)
         */
        socket.on('delete-annotation', async (data: { annotationId: string }) => {
            try {
                const { annotationId } = data;

                const annotation = await Annotation.findById(annotationId);

                if (!annotation) {
                    socket.emit('error', { message: 'Annotation not found' });
                    return;
                }

                const documentId = annotation.documentId.toString();

                // Check if user can delete
                const document = await DocumentModel.findById(documentId);
                const isOwner = document?.owner.toString() === user.id;
                const isCreator = annotation.userId.toString() === user.id;

                if (!isCreator && !isOwner) {
                    socket.emit('error', { message: 'Cannot delete this annotation' });
                    return;
                }

                await annotation.deleteOne();

                // Broadcast to all users in the document room
                io.to(`doc:${documentId}`).emit('annotation-deleted', {
                    annotationId,
                    documentId,
                });

                console.log(`🗑️ Annotation deleted from document ${documentId}`);
            } catch (error) {
                console.error('Error deleting annotation:', error);
                socket.emit('error', { message: 'Failed to delete annotation' });
            }
        });

        /**
         * Handle disconnect
         */
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);

            // Remove user from all document rooms
            documentUsers.forEach((users, documentId) => {
                if (users.has(user.id)) {
                    users.delete(user.id);

                    if (users.size === 0) {
                        documentUsers.delete(documentId);
                    } else {
                        // Notify others
                        socket.to(`doc:${documentId}`).emit('user-left', {
                            userId: user.id,
                            documentId,
                        });
                    }
                }
            });
        });
    });
}

export default initializeSocket;
