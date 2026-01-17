/**
 * Document type definitions shared between frontend and backend
 */

export type FileType = 'text' | 'pdf' | 'binary';

export interface IDocument {
    _id: string;
    title: string;
    fileName: string;
    fileType: FileType;
    content: string;
    originalPath: string;
    owner: string;
    collaborators: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IDocumentCreate {
    title: string;
    file: File;
}

export interface IDocumentListItem {
    _id: string;
    title: string;
    fileName: string;
    fileType: FileType;
    owner: string;
    collaboratorCount: number;
    annotationCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAddCollaborator {
    email: string;
}
