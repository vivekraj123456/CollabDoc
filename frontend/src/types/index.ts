/**
 * Frontend type definitions
 * Re-exports common types and adds frontend-specific types
 */

// User types
export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    color: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Document types
export type FileType = 'text' | 'pdf' | 'binary';

export interface Document {
    _id: string;
    title: string;
    fileName: string;
    fileType: FileType;
    content?: string;
    owner: User | string;
    collaborators: User[] | string[];
    collaboratorCount?: number;
    annotationCount?: number;
    createdAt: string;
    updatedAt: string;
}

// Annotation types
export interface Annotation {
    _id: string;
    documentId: string;
    userId: string;
    user?: {
        _id: string;
        username: string;
        displayName: string;
        color: string;
    };
    startOffset: number;
    endOffset: number;
    selectedText: string;
    comment: string;
    color: string;
    isResolved: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AnnotationCreate {
    startOffset: number;
    endOffset: number;
    selectedText: string;
    comment: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Active user for real-time collaboration
export interface ActiveUser {
    id: string;
    username: string;
    displayName: string;
    color: string;
}

// Text selection
export interface TextSelection {
    startOffset: number;
    endOffset: number;
    selectedText: string;
}
