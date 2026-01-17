/**
 * Socket Context
 * Manages Socket.io connection state
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinDocument: (documentId: string) => void;
    leaveDocument: (documentId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated && token) {
            // Connect to socket server
            const newSocket = socketService.connect(token);
            setSocket(newSocket);

            // Handle connection state
            const handleConnect = () => setIsConnected(true);
            const handleDisconnect = () => setIsConnected(false);

            newSocket.on('connect', handleConnect);
            newSocket.on('disconnect', handleDisconnect);

            // Set initial state
            setIsConnected(newSocket.connected);

            return () => {
                newSocket.off('connect', handleConnect);
                newSocket.off('disconnect', handleDisconnect);
            };
        } else {
            // Disconnect when logged out
            socketService.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [isAuthenticated, token]);

    const joinDocument = (documentId: string) => {
        socketService.joinDocument(documentId);
    };

    const leaveDocument = (documentId: string) => {
        socketService.leaveDocument(documentId);
    };

    const value: SocketContextType = {
        socket,
        isConnected,
        joinDocument,
        leaveDocument,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): SocketContextType {
    const context = useContext(SocketContext);

    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }

    return context;
}

export default SocketContext;
