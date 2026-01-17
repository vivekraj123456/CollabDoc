/**
 * Annotation Routes
 * Defines routes for annotation management
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
    getAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
} from '../controllers/annotation.controller';
import { authenticate, validate } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/documents/:docId/annotations
 * @desc    Get all annotations for a document
 * @access  Private
 */
router.get(
    '/documents/:docId/annotations',
    validate([
        param('docId').isMongoId().withMessage('Invalid document ID'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 500 })
            .withMessage('Limit must be between 1 and 500'),
    ]),
    getAnnotations
);

/**
 * @route   POST /api/documents/:docId/annotations
 * @desc    Create a new annotation
 * @access  Private
 */
router.post(
    '/documents/:docId/annotations',
    validate([
        param('docId').isMongoId().withMessage('Invalid document ID'),
        body('startOffset')
            .isInt({ min: 0 })
            .withMessage('Start offset must be a non-negative integer'),
        body('endOffset')
            .isInt({ min: 1 })
            .withMessage('End offset must be a positive integer'),
        body('selectedText')
            .trim()
            .notEmpty()
            .withMessage('Selected text is required')
            .isLength({ max: 10000 })
            .withMessage('Selected text cannot exceed 10000 characters'),
        body('comment')
            .trim()
            .notEmpty()
            .withMessage('Comment is required')
            .isLength({ max: 5000 })
            .withMessage('Comment cannot exceed 5000 characters'),
    ]),
    createAnnotation
);

/**
 * @route   PUT /api/annotations/:id
 * @desc    Update an annotation
 * @access  Private (creator only)
 */
router.put(
    '/annotations/:id',
    validate([
        param('id').isMongoId().withMessage('Invalid annotation ID'),
        body('comment')
            .optional()
            .trim()
            .isLength({ max: 5000 })
            .withMessage('Comment cannot exceed 5000 characters'),
        body('isResolved')
            .optional()
            .isBoolean()
            .withMessage('isResolved must be a boolean'),
    ]),
    updateAnnotation
);

/**
 * @route   DELETE /api/annotations/:id
 * @desc    Delete an annotation
 * @access  Private (creator or document owner)
 */
router.delete(
    '/annotations/:id',
    validate([
        param('id').isMongoId().withMessage('Invalid annotation ID'),
    ]),
    deleteAnnotation
);

export default router;
