/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
    User,
    Document,
    Annotation,
    AuthResponse,
    AnnotationCreate
} from '../types';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        const message = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
    }
);

/**
 * Authentication API
 */
export const authApi = {
    /**
     * Register a new user
     */
    register: async (data: {
        username: string;
        email: string;
        password: string;
        displayName?: string;
    }): Promise<AuthResponse> => {
        const response = await api.post<{ success: boolean; data: AuthResponse }>(
            '/auth/register',
            data
        );
        return response.data.data;
    },

    /**
     * Login user
     */
    login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
        const response = await api.post<{ success: boolean; data: AuthResponse }>(
            '/auth/login',
            data
        );
        return response.data.data;
    },

    /**
     * Get current user
     */
    getMe: async (): Promise<User> => {
        const response = await api.get<{ success: boolean; data: { user: User } }>(
            '/auth/me'
        );
        return response.data.data.user;
    },
};

/**
 * Documents API
 */
export const documentsApi = {
    /**
     * Get all documents
     */
    getAll: async (): Promise<Document[]> => {
        const response = await api.get<{ success: boolean; data: { documents: Document[] } }>(
            '/documents'
        );
        return response.data.data.documents;
    },

    /**
     * Get a single document
     */
    getById: async (id: string): Promise<Document> => {
        const response = await api.get<{ success: boolean; data: { document: Document } }>(
            `/documents/${id}`
        );
        return response.data.data.document;
    },

    /**
     * Upload a new document
     */
    upload: async (file: File, title?: string): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) {
            formData.append('title', title);
        }

        const response = await api.post<{ success: boolean; data: { document: Document } }>(
            '/documents/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data.document;
    },

    /**
     * Delete a document
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/documents/${id}`);
    },

    /**
     * Add a collaborator
     */
    addCollaborator: async (
        documentId: string,
        email: string
    ): Promise<{ _id: string; username: string; displayName: string; color: string }> => {
        const response = await api.post<{
            success: boolean;
            data: { collaborator: { _id: string; username: string; displayName: string; color: string } };
        }>(`/documents/${documentId}/collaborators`, { email });
        return response.data.data.collaborator;
    },
};

/**
 * Annotations API
 */
export const annotationsApi = {
    /**
     * Get all annotations for a document
     */
    getByDocument: async (
        documentId: string,
        page = 1,
        limit = 100
    ): Promise<{ annotations: Annotation[]; pagination: any }> => {
        const response = await api.get<{
            success: boolean;
            data: { annotations: Annotation[]; pagination: any };
        }>(`/documents/${documentId}/annotations`, {
            params: { page, limit },
        });
        return response.data.data;
    },

    /**
     * Create a new annotation
     */
    create: async (documentId: string, data: AnnotationCreate): Promise<Annotation> => {
        const response = await api.post<{ success: boolean; data: { annotation: Annotation } }>(
            `/documents/${documentId}/annotations`,
            data
        );
        return response.data.data.annotation;
    },

    /**
     * Update an annotation
     */
    update: async (
        id: string,
        data: { comment?: string; isResolved?: boolean }
    ): Promise<Annotation> => {
        const response = await api.put<{ success: boolean; data: { annotation: Annotation } }>(
            `/annotations/${id}`,
            data
        );
        return response.data.data.annotation;
    },

    /**
     * Delete an annotation
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/annotations/${id}`);
    },
};

export default api;
