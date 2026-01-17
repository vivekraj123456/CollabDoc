/**
 * Document Model
 * Handles document storage and metadata
 */

import mongoose, { Document, Schema } from 'mongoose';

export type FileType = 'text' | 'pdf' | 'binary';

export interface IDocumentDocument extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    fileName: string;
    fileType: FileType;
    content: string;
    originalPath: string;
    owner: mongoose.Types.ObjectId;
    collaborators: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new Schema<IDocumentDocument>(
    {
        title: {
            type: String,
            required: [true, 'Document title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        fileType: {
            type: String,
            enum: ['text', 'pdf', 'binary'],
            required: [true, 'File type is required'],
        },
        content: {
            type: String,
            required: [true, 'Document content is required'],
        },
        originalPath: {
            type: String,
            required: [true, 'Original file path is required'],
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Document owner is required'],
            index: true,
        },
        collaborators: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes for query optimization
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ collaborators: 1 });
documentSchema.index({ title: 'text' }); // Text search index

/**
 * Check if user has access to the document
 */
documentSchema.methods.hasAccess = function (userId: string): boolean {
    const ownerStr = this.owner.toString();
    const collaboratorIds = this.collaborators.map((c: mongoose.Types.ObjectId) => c.toString());
    return ownerStr === userId || collaboratorIds.includes(userId);
};

/**
 * Check if user is the owner
 */
documentSchema.methods.isOwner = function (userId: string): boolean {
    return this.owner.toString() === userId;
};

export const DocumentModel = mongoose.model<IDocumentDocument>('Document', documentSchema);
export default DocumentModel;
