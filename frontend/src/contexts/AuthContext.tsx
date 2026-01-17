/**
 * Authentication Context
 * Manages user authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;

            try {
                const currentUser = await authApi.getMe();
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
            } catch {
                // Token is invalid
                logout();
            }
        };

        if (token && !isLoading) {
            verifyToken();
        }
    }, [token, isLoading]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authApi.login({ email, password });

        setUser(response.user);
        setToken(response.token);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
    }, []);

    const register = useCallback(async (data: {
        username: string;
        email: string;
        password: string;
        displayName?: string;
    }) => {
        const response = await authApi.register(data);

        setUser(response.user);
        setToken(response.token);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export default AuthContext;
