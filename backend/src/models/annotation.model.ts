/**
 * Annotation Model
 * Handles document annotations with optimized indexing for performance
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnotationDocument extends Document {
    _id: mongoose.Types.ObjectId;
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    startOffset: number;
    endOffset: number;
    selectedText: string;
    comment: string;
    color: string;
    isResolved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const annotationSchema = new Schema<IAnnotationDocument>(
    {
        documentId: {
            type: Schema.Types.ObjectId,
            ref: 'Document',
            required: [true, 'Document ID is required'],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        startOffset: {
            type: Number,
            required: [true, 'Start offset is required'],
            min: [0, 'Start offset cannot be negative'],
        },
        endOffset: {
            type: Number,
            required: [true, 'End offset is required'],
            validate: {
                validator: function (this: IAnnotationDocument, value: number) {
                    return value > this.startOffset;
                },
                message: 'End offset must be greater than start offset',
            },
        },
        selectedText: {
            type: String,
            required: [true, 'Selected text is required'],
            maxlength: [10000, 'Selected text cannot exceed 10000 characters'],
        },
        comment: {
            type: String,
            required: [true, 'Comment is required'],
            maxlength: [5000, 'Comment cannot exceed 5000 characters'],
            trim: true,
        },
        color: {
            type: String,
            required: true,
        },
        isResolved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Compound index for duplicate prevention
 * Prevents same user from creating exact same annotation on same range
 */
annotationSchema.index(
    { documentId: 1, startOffset: 1, endOffset: 1, userId: 1 },
    { unique: true }
);

/**
 * Index for efficient annotation loading by document
 */
annotationSchema.index({ documentId: 1, createdAt: -1 });

/**
 * Index for user's annotations
 */
annotationSchema.index({ userId: 1, createdAt: -1 });

/**
 * Pre-save hook to check for duplicate annotations
 * Additional validation beyond the unique index
 */
annotationSchema.pre('save', async function (next) {
    if (this.isNew) {
        const Annotation = mongoose.model<IAnnotationDocument>('Annotation');
        const existingAnnotation = await Annotation.findOne({
            documentId: this.documentId,
            userId: this.userId,
            startOffset: this.startOffset,
            endOffset: this.endOffset,
        });

        if (existingAnnotation) {
            const error = new Error('Duplicate annotation: You already have an annotation on this exact range');
            (error as any).code = 11000; // MongoDB duplicate key error code
            return next(error);
        }
    }
    next();
});

/**
 * Static method to find overlapping annotations
 */
annotationSchema.statics.findOverlapping = async function (
    documentId: string,
    startOffset: number,
    endOffset: number
): Promise<IAnnotationDocument[]> {
    return this.find({
        documentId,
        $or: [
            // New annotation starts within existing
            { startOffset: { $lte: startOffset }, endOffset: { $gt: startOffset } },
            // New annotation ends within existing
            { startOffset: { $lt: endOffset }, endOffset: { $gte: endOffset } },
            // New annotation completely contains existing
            { startOffset: { $gte: startOffset }, endOffset: { $lte: endOffset } },
        ],
    }).populate('userId', 'username displayName color');
};

export const Annotation = mongoose.model<IAnnotationDocument>('Annotation', annotationSchema);
export default Annotation;
