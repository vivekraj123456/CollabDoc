/**
 * Annotation Controller
 * Handles annotation CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { Annotation, DocumentModel } from '../../models';
import { NotFoundError, ForbiddenError, ConflictError } from '../../utils';

/**
 * Get all annotations for a document
 * GET /api/documents/:docId/annotations
 */
export async function getAnnotations(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { docId } = req.params;
        const userId = req.userId!;
        const { page = 1, limit = 100 } = req.query;

        // Check document access
        const document = await DocumentModel.findById(docId);

        if (!document) {
            throw new NotFoundError('Document not found');
        }

        const hasAccess =
            document.owner.toString() === userId ||
            document.collaborators.some((c) => c.toString() === userId);

        if (!hasAccess) {
            throw new ForbiddenError('You do not have access to this document');
        }

        // Get annotations with pagination
        const skip = (Number(page) - 1) * Number(limit);

        const [annotations, total] = await Promise.all([
            Annotation.find({ documentId: docId })
                .populate('userId', 'username displayName color')
                .sort({ startOffset: 1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Annotation.countDocuments({ documentId: docId }),
        ]);

        // Transform to match frontend expectations
        const transformedAnnotations = annotations.map((a) => ({
            ...a,
            user: a.userId,
            userId: (a.userId as any)?._id || a.userId,
        }));

        res.json({
            success: true,
            data: {
                annotations: transformedAnnotations,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a new annotation
 * POST /api/documents/:docId/annotations
 */
export async function createAnnotation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { docId } = req.params;
        const { startOffset, endOffset, selectedText, comment } = req.body;
        const userId = req.userId!;
        const user = req.user!;

        // Check document access
        const document = await DocumentModel.findById(docId);

        if (!document) {
            throw new NotFoundError('Document not found');
        }

        const hasAccess =
            document.owner.toString() === userId ||
            document.collaborators.some((c) => c.toString() === userId);

        if (!hasAccess) {
            throw new ForbiddenError('You do not have access to this document');
        }

        // Check for duplicate annotation
        const existing = await Annotation.findOne({
            documentId: docId,
            userId,
            startOffset,
            endOffset,
        });

        if (existing) {
            throw new ConflictError(
                'You already have an annotation on this exact range'
            );
        }

        // Create annotation
        const annotation = await Annotation.create({
            documentId: docId,
            userId,
            startOffset,
            endOffset,
            selectedText,
            comment,
            color: user.color,
        });

        // Populate user info
        await annotation.populate('userId', 'username displayName color');

        const response = {
            ...annotation.toObject(),
            user: annotation.userId,
            userId: user._id,
        };

        res.status(201).json({
            success: true,
            data: { annotation: response },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update an annotation
 * PUT /api/annotations/:id
 */
export async function updateAnnotation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { comment, isResolved } = req.body;
        const userId = req.userId!;

        const annotation = await Annotation.findById(id);

        if (!annotation) {
            throw new NotFoundError('Annotation not found');
        }

        // Only the creator can update
        if (annotation.userId.toString() !== userId) {
            throw new ForbiddenError('You can only update your own annotations');
        }

        // Update fields
        if (comment !== undefined) annotation.comment = comment;
        if (isResolved !== undefined) annotation.isResolved = isResolved;

        await annotation.save();
        await annotation.populate('userId', 'username displayName color');

        const response = {
            ...annotation.toObject(),
            user: annotation.userId,
            userId: (annotation.userId as any)._id,
        };

        res.json({
            success: true,
            data: { annotation: response },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete an annotation
 * DELETE /api/annotations/:id
 */
export async function deleteAnnotation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const annotation = await Annotation.findById(id);

        if (!annotation) {
            throw new NotFoundError('Annotation not found');
        }

        // Check if user can delete (creator or document owner)
        const document = await DocumentModel.findById(annotation.documentId);
        const isOwner = document?.owner.toString() === userId;
        const isCreator = annotation.userId.toString() === userId;

        if (!isCreator && !isOwner) {
            throw new ForbiddenError(
                'Only the annotation creator or document owner can delete'
            );
        }

        const documentId = annotation.documentId;
        await annotation.deleteOne();

        res.json({
            success: true,
            message: 'Annotation deleted successfully',
            data: { annotationId: id, documentId },
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
};
