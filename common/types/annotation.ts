/**
 * Annotation type definitions shared between frontend and backend
 */

export interface IAnnotation {
    _id: string;
    documentId: string;
    userId: string;
    startOffset: number;
    endOffset: number;
    selectedText: string;
    comment: string;
    color: string;
    isResolved: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Populated fields
    user?: {
        _id: string;
        username: string;
        displayName: string;
        color: string;
    };
}

export interface IAnnotationCreate {
    documentId: string;
    startOffset: number;
    endOffset: number;
    selectedText: string;
    comment: string;
}

export interface IAnnotationUpdate {
    comment?: string;
    isResolved?: boolean;
}

/**
 * Socket.io event payloads
 */
export interface IJoinDocument {
    documentId: string;
}

export interface IAnnotationEvent {
    annotation: IAnnotation;
}

export interface IAnnotationDeleteEvent {
    annotationId: string;
    documentId: string;
}

export interface IUserJoinedEvent {
    user: {
        id: string;
        username: string;
        displayName: string;
        color: string;
    };
    documentId: string;
}

export interface IUserLeftEvent {
    userId: string;
    documentId: string;
}

export interface IActiveUsersEvent {
    users: Array<{
        id: string;
        username: string;
        displayName: string;
        color: string;
    }>;
    documentId: string;
}
